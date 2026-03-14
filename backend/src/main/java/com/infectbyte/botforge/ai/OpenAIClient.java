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

        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        return reactor.core.publisher.Flux.<String>create(emitter -> {
            try {
                String jsonBody = mapper.writeValueAsString(body);
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create(properties.getBaseUrl() + "/chat/completions"))
                        .header("Authorization", "Bearer " + properties.getApiKey())
                        .header("Content-Type", "application/json")
                        .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                java.net.http.HttpResponse<java.io.InputStream> resp =
                        client.send(req, java.net.http.HttpResponse.BodyHandlers.ofInputStream());

                if (resp.statusCode() != 200) {
                    emitter.error(new RuntimeException("OpenAI returned HTTP " + resp.statusCode()));
                    return;
                }

                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(resp.body(), java.nio.charset.StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (!line.startsWith("data: ")) continue;
                        if (line.equals("data: [DONE]")) break;
                        String json = line.substring(6).trim();
                        if (json.isEmpty()) continue;
                        try {
                            com.fasterxml.jackson.databind.JsonNode node = mapper.readTree(json);
                            com.fasterxml.jackson.databind.JsonNode contentNode = node
                                    .path("choices").get(0).path("delta").path("content");
                            if (!contentNode.isMissingNode() && !contentNode.isNull()) {
                                String token = contentNode.asText();
                                if (!token.isEmpty()) emitter.next(token);
                            }
                        } catch (Exception e) {
                            log.warn("Failed to parse OpenAI chunk: {}", json);
                        }
                    }
                }
                emitter.complete();
            } catch (Exception e) {
                emitter.error(e);
            }
        }).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic());
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
