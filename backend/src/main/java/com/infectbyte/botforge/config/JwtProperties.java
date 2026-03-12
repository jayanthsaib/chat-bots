package com.infectbyte.botforge.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "botforge.jwt")
@Data
public class JwtProperties {
    private String secret = "dev-secret-key-change-in-production-must-be-at-least-256-bits-long";
    private long accessTokenExpiry = 900;
    private long refreshTokenExpiry = 604800;
}
