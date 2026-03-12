package com.infectbyte.botforge.config;

import com.infectbyte.botforge.common.TenantContext;
import com.infectbyte.botforge.domain.apikey.ApiKey;
import com.infectbyte.botforge.domain.apikey.ApiKeyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String apiKeyHeader = request.getHeader("X-API-Key");

        if (apiKeyHeader != null && apiKeyHeader.startsWith("bf_live_")) {
            // Find by prefix + hash match
            String prefix = apiKeyHeader.substring(0, Math.min(apiKeyHeader.length(), 16));

            // Search all keys with matching prefix and verify hash
            Optional<ApiKey> matchingKey = apiKeyRepository.findAll().stream()
                    .filter(k -> k.getKeyPrefix().equals(prefix) &&
                            passwordEncoder.matches(apiKeyHeader, k.getKeyHash()))
                    .findFirst();

            if (matchingKey.isPresent()) {
                ApiKey apiKey = matchingKey.get();
                apiKey.setLastUsedAt(LocalDateTime.now());
                apiKeyRepository.save(apiKey);

                TenantContext.setTenantId(apiKey.getTenantId());

                var auth = new UsernamePasswordAuthenticationToken(
                        "api-key:" + apiKey.getId(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_WIDGET"))
                );
                auth.setDetails(apiKey);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            if (apiKeyHeader != null) {
                TenantContext.clear();
            }
        }
    }
}
