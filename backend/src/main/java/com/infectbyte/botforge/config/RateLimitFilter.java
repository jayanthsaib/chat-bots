package com.infectbyte.botforge.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Separate bucket maps per limit tier
    private final ConcurrentHashMap<String, Bucket> authBuckets    = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> chatBuckets    = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> generalBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Skip health checks and OPTIONS pre-flight
        if (path.startsWith("/actuator") || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String key = resolveKey(request);
        Bucket bucket = resolveBucket(path, key);

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"success\":false,\"message\":\"Too many requests. Please slow down.\"}");
        }
    }

    /** Key = authenticated tenant ID (from header) OR client IP */
    private String resolveKey(HttpServletRequest request) {
        // If JWT auth filter already set tenant in header, use that; otherwise fall back to IP
        String tenantId = request.getHeader("X-Tenant-Id");
        if (tenantId != null && !tenantId.isBlank()) return "t:" + tenantId;

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) return "ip:" + forwarded.split(",")[0].trim();
        return "ip:" + request.getRemoteAddr();
    }

    private Bucket resolveBucket(String path, String key) {
        if (path.startsWith("/api/v1/auth/")) {
            // 10 requests per minute — brute force protection
            return authBuckets.computeIfAbsent(key, k -> newBucket(10, Duration.ofMinutes(1)));
        } else if (path.startsWith("/api/v1/chat/")) {
            // 30 requests per minute — widget/anonymous users
            return chatBuckets.computeIfAbsent(key, k -> newBucket(30, Duration.ofMinutes(1)));
        } else {
            // 60 requests per minute — authenticated dashboard users
            return generalBuckets.computeIfAbsent(key, k -> newBucket(60, Duration.ofMinutes(1)));
        }
    }

    private Bucket newBucket(long capacity, Duration refillPeriod) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(capacity)
                        .refillGreedy(capacity, refillPeriod)
                        .build())
                .build();
    }
}
