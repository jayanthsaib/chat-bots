package com.infectbyte.botforge.api.auth;

import com.infectbyte.botforge.common.BusinessException;
import com.infectbyte.botforge.config.JwtUtil;
import com.infectbyte.botforge.domain.tenant.Tenant;
import com.infectbyte.botforge.domain.tenant.TenantRepository;
import com.infectbyte.botforge.domain.user.User;
import com.infectbyte.botforge.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (tenantRepository.existsByEmail(request.email())) {
            throw new BusinessException("An account with this email already exists");
        }

        String slug = generateSlug(request.businessName());

        Tenant tenant = Tenant.builder()
                .name(request.businessName())
                .slug(slug)
                .email(request.email())
                .plan("starter")
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenantId(tenant.getId())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role("admin")
                .build();
        user = userRepository.save(user);

        return buildAuthResponse(user, tenant);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        Tenant tenant = tenantRepository.findById(user.getTenantId())
                .orElseThrow(() -> new BadCredentialsException("Tenant not found"));

        return buildAuthResponse(user, tenant);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtUtil.isValid(refreshToken)) {
            throw new BusinessException("Invalid refresh token");
        }

        java.util.UUID userId = jwtUtil.getUserId(refreshToken);
        java.util.UUID tenantId = jwtUtil.getTenantId(refreshToken);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("User not found"));
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new BusinessException("Tenant not found"));

        return buildAuthResponse(user, tenant);
    }

    private AuthResponse buildAuthResponse(User user, Tenant tenant) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), tenant.getId(),
                user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId(), tenant.getId());

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId(),
                tenant.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                tenant.getName(),
                tenant.getPlan()
        );
    }

    private String generateSlug(String name) {
        String base = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");

        String slug = base;
        int counter = 1;
        while (tenantRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }
}
