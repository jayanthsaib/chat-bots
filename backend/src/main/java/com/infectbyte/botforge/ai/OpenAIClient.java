package com.infectbyte.botforge.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.infectbyte.botforge.config.OpenAIProperties;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAIClient {

    private final OpenAIProperties properties;
    private final WebClient.Builder webClientBuilder;

    private WebClient getClient() {
        return webClientBuilder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.getApiKey())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public float[] embed(String text) {
        Map<String, Object> body = Map.of(
                "input", text,
                "model", properties.getEmbeddingModel()
        );

        EmbeddingResponse response = getClient()
                .post()
                .uri("/embeddings")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(EmbeddingResponse.class)
                .block();

        if (response == null || response.getData() == null || response.getData().isEmpty()) {
            throw new RuntimeException("Empty embedding response from OpenAI");
        }

        List<Double> doubles = response.getData().get(0).getEmbedding();
        float[] floats = new float[doubles.size()];
        for (int i = 0; i < doubles.size(); i++) {
            floats[i] = doubles.get(i).floatValue();
        }
        return floats;
    }

    public Flux<String> streamChat(String systemPrompt, List<ChatMessage> messages) {
        List<Map<String, String>> allMessages = new java.util.ArrayList<>();
        allMessages.add(Map.of("role", "system", "content", systemPrompt));
        for (ChatMessage msg : messages) {
            allMessages.add(Map.of("role", msg.role(), "content", msg.content()));
        }

        Map<String, Object> body = Map.of(
                "model", properties.getChatModel(),
                "messages", allMessages,
                "stream", true,
                "max_tokens", 1000,
                "temperature", 0.7
        );

        return getClient()
                .post()
                .uri("/chat/completions")
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class)
                .filter(line -> line.startsWith("data: ") && !line.equals("data: [DONE]"))
                .map(line -> line.substring(6))
                .mapNotNull(json -> {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(json);
                        com.fasterxml.jackson.databind.JsonNode delta = node
                                .path("choices").get(0).path("delta").path("content");
                        return delta.isMissingNode() || delta.isNull() ? null : delta.asText();
                    } catch (Exception e) {
                        return null;
                    }
                });
    }

    // DTOs
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EmbeddingResponse {
        private List<EmbeddingData> data;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class EmbeddingData {
        private List<Double> embedding;
    }

    public record ChatMessage(String role, String content) {}
}
