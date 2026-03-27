package com.infectbyte.botforge.ai;

import com.infectbyte.botforge.domain.chatbot.Chatbot;
import com.infectbyte.botforge.domain.conversation.Message;
import com.infectbyte.botforge.domain.knowledge.KnowledgeChunk;
import com.infectbyte.botforge.domain.knowledge.KnowledgeChunkRepository;
import com.infectbyte.botforge.domain.knowledge.KnowledgeSource;
import com.infectbyte.botforge.domain.knowledge.KnowledgeSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RAGService {

    private static final double SIMILARITY_THRESHOLD = 0.70;

    private final KnowledgeChunkRepository chunkRepository;
    private final KnowledgeSourceRepository sourceRepository;
    private final EmbeddingService embeddingService;

    private static final String SYSTEM_PROMPT_TEMPLATE = """
            You are %s, an AI assistant for %s.

            BUSINESS CONTEXT:
            %s

            YOUR PERSONALITY:
            %s

            STRICT INSTRUCTIONS — YOU MUST FOLLOW THESE EXACTLY:
            1. For greetings, small talk, or conversational messages (hi, hello, thanks, bye, how are you etc.) — respond naturally and warmly.
            2. For any factual question about the business, products, services, or specific information — answer ONLY using the RELEVANT KNOWLEDGE section below.
            3. If a factual question's answer is NOT found in the RELEVANT KNOWLEDGE section, you MUST respond:
               "I don't have that information. Please contact our team for help."
               Do NOT use your general training knowledge to answer factual questions.
            4. Be friendly, concise, and professional.
            5. If the user wants to book an appointment, collect their name and preferred date/time.
            6. If the user shows buying intent or asks for pricing, offer to capture their contact info.
            7. Respond in %s.
            8. Keep responses concise — 2-4 sentences when possible.

            RELEVANT KNOWLEDGE:
            %s
            """;

    public record SourceCitation(String title, String url) {}
    public record RAGResult(String systemPrompt, boolean hasKnowledge, List<SourceCitation> sources) {}

    public RAGResult buildPrompt(UUID chatbotId, UUID tenantId, String userMessage,
                                  Chatbot chatbot) {
        // Embed user query
        float[] queryVector = embeddingService.embedQuery(userMessage);
        String vectorStr = toVectorString(queryVector);

        // Find top-5 chunks with similarity >= threshold (filters out loosely-related chunks)
        List<KnowledgeChunk> chunks = chunkRepository.findSimilarChunksAboveThreshold(
                chatbotId, tenantId, vectorStr, 5, SIMILARITY_THRESHOLD);
        log.info("RAG: found {} relevant chunks (threshold={}) for query: {}", chunks.size(), SIMILARITY_THRESHOLD, userMessage);

        boolean hasKnowledge = !chunks.isEmpty();
        String context = hasKnowledge
                ? chunks.stream().map(KnowledgeChunk::getChunkText)
                        .collect(Collectors.joining("\n\n---\n\n"))
                : "[NO KNOWLEDGE AVAILABLE — You have no information to answer this question. You MUST say you don't have that information.]";

        // Build source citations from unique source IDs
        List<SourceCitation> sources = hasKnowledge
                ? chunks.stream()
                        .map(KnowledgeChunk::getSourceId)
                        .distinct()
                        .map(sourceId -> sourceRepository.findById(sourceId).orElse(null))
                        .filter(s -> s != null)
                        .map(s -> new SourceCitation(
                                s.getTitle() != null ? s.getTitle() : s.getSourceType(),
                                s.getWebsiteUrl() != null ? s.getWebsiteUrl() : s.getFileUrl()))
                        .filter(c -> c.url() != null)
                        .collect(Collectors.toList())
                : List.of();

        String prompt = SYSTEM_PROMPT_TEMPLATE.formatted(
                chatbot.getName(),
                chatbot.getName(),
                chatbot.getDescription() != null ? chatbot.getDescription() : "",
                chatbot.getPersonality() != null ? chatbot.getPersonality() : "Professional and helpful",
                chatbot.getLanguage() != null ? chatbot.getLanguage() : "en",
                context
        );
        return new RAGResult(prompt, hasKnowledge, sources);
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
