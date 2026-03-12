package com.infectbyte.botforge.api.auth;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UUID userId,
        UUID tenantId,
        String email,
        String fullName,
        String role,
        String businessName,
        String plan
) {}
