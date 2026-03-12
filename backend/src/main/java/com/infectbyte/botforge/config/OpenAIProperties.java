package com.infectbyte.botforge.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "botforge.openai")
@Data
public class OpenAIProperties {
    private String apiKey;
    private String embeddingModel = "text-embedding-ada-002";
    private String chatModel = "gpt-4o-mini";
    private String baseUrl = "https://api.openai.com/v1";
}
