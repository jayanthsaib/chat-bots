package com.infectbyte.botforge.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "botforge.razorpay")
@Getter
@Setter
public class RazorpayProperties {
    private String keyId;
    private String keySecret;
    private String webhookSecret;
}
