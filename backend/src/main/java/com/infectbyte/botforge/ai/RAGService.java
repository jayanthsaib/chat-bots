package com.infectbyte.botforge.ai;

import com.infectbyte.botforge.domain.chatbot.Chatbot;
import com.infectbyte.botforge.domain.conversation.Message;
import com.infectbyte.botforge.domain.knowledge.KnowledgeChunk;
import com.infectbyte.botforge.domain.knowledge.KnowledgeChunkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RAGService {

    private final KnowledgeChunkRepository chunkRepository;
    private final EmbeddingService embeddingService;

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            You are %s, an AI assistant for %s.

            BUSINESS CONTEXT:
            %s

            YOUR PERSONALITY:
            %s

            STRICT INSTRUCTIONS — YOU MUST FOLLOW THESE EXACTLY:
            1. You ONLY answer using the RELEVANT KNOWLEDGE section below. Nothing else.
            2. You do NOT have general knowledge. You are NOT a general-purpose AI.
            3. If the answer is not found in the RELEVANT KNOWLEDGE section, you MUST respond:
               "I don't have that information. Please contact our team for help."
               Do NOT answer from memory, training data, or common knowledge — even if you know the answer.
            4. Be friendly, concise, and professional.
            5. If the user wants to book an appointment, collect their name and preferred date/time.
            6. If the user shows buying intent or asks for pricing, offer to capture their contact info.
            7. Respond in %s.
            8. Keep responses concise — 2-4 sentences when possible.

            RELEVANT KNOWLEDGE:
            %s
            """;

    public String buildSystemPrompt(UUID chatbotId, UUID tenantId, String userMessage,
                                     Chatbot chatbot) {
        // Embed user query
        float[] queryVector = embeddingService.embedQuery(userMessage);
        String vectorStr = toVectorString(queryVector);

        // Find top-5 similar chunks
        List<KnowledgeChunk> chunks = chunkRepository.findSimilarChunks(chatbotId, tenantId, vectorStr, 5);

        String context = chunks.isEmpty()
                ? "[NO KNOWLEDGE AVAILABLE — You have no information to answer this question. You MUST say you don't have that information.]"
                : chunks.stream().map(KnowledgeChunk::getChunkText)
                        .collect(Collectors.joining("\n\n---\n\n"));

        return SYSTEM_PROMPT_TEMPLATE.formatted(
                chatbot.getName(),
                chatbot.getName(),
                chatbot.getDescription() != null ? chatbot.getDescription() : "",
                chatbot.getPersonality() != null ? chatbot.getPersonality() : "Professional and helpful",
                chatbot.getLanguage() != null ? chatbot.getLanguage() : "en",
                context
        );
    }

    public List<OpenAIClient.ChatMessage> buildMessageHistory(List<Message> history) {
        // Take last 5 messages for context
        int start = Math.max(0, history.size() - 5);
        return history.subList(start, history.size()).stream()
                .map(m -> new OpenAIClient.ChatMessage(m.getRole(), m.getContent()))
                .collect(Collectors.toList());
    }

    private String toVectorString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
