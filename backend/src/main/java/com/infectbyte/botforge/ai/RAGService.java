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

    private static final double SIMILARITY_THRESHOLD = 0.60;

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
            2. For any factual question about the business, products, services, or specific information — answer using the RELEVANT KNOWLEDGE section below.
            3. For vague follow-ups like "details?", "more?", "explain" — use the conversation history to understand what the user is asking about and answer from the knowledge.
            4. If the answer is truly NOT found anywhere in the RELEVANT KNOWLEDGE section, respond:
               "I don't have that information. Please contact our team for help."
               Do NOT use your general training knowledge to answer factual questions.
            5. Be friendly, concise, and professional.
            6. If the user wants to book an appointment, collect their name and preferred date/time.
            7. If the user shows buying intent or asks for pricing, offer to capture their contact info.
            8. Language: Detect the language the user is writing in and ALWAYS respond in that same language. If the user writes in Hindi, respond in Hindi. If in Arabic, respond in Arabic. If in English, respond in English. Never switch languages unless the user does.
            9. Keep responses concise — 2-4 sentences when possible.

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

        // Semantic search: top 10 above threshold (leaves room for keyword supplements)
        List<KnowledgeChunk> chunks = new java.util.ArrayList<>(chunkRepository.findSimilarChunksAboveThreshold(
                chatbotId, tenantId, vectorStr, 10, SIMILARITY_THRESHOLD));
        log.info("RAG: found {} semantic chunks (threshold={}) for query: {}", chunks.size(), SIMILARITY_THRESHOLD, userMessage);

        // Keyword supplement: always add keyword-matched chunks not already in results
        java.util.Set<String> stopWords = java.util.Set.of(
            "who", "what", "where", "when", "how", "why", "which", "the", "and",
            "for", "are", "you", "tell", "can", "give", "does", "did", "has",
            "have", "its", "this", "that", "with", "from", "about", "your"
        );
        String[] words = userMessage.toLowerCase().replaceAll("[^a-z0-9 ]", " ").trim().split("\\s+");
        java.util.Set<UUID> seen = new java.util.HashSet<>();
        chunks.forEach(c -> seen.add(c.getId()));
        for (String word : words) {
            if (word.length() < 3 || stopWords.contains(word)) continue;
            List<KnowledgeChunk> kwResults = chunkRepository.findByKeyword(
                    chatbotId, tenantId, "%" + word + "%", 15);
            for (KnowledgeChunk kw : kwResults) {
                if (seen.add(kw.getId())) chunks.add(kw);
            }
        }

        // Dynamic token budget: include chunks until we reach ~2000 tokens (~8000 chars)
        final int TOKEN_BUDGET_CHARS = 8000;
        int totalChars = 0;
        List<KnowledgeChunk> budgeted = new java.util.ArrayList<>();
        for (KnowledgeChunk c : chunks) {
            int len = c.getChunkText().length();
            if (totalChars + len > TOKEN_BUDGET_CHARS) break;
            budgeted.add(c);
            totalChars += len;
        }
        chunks = budgeted;
        log.info("RAG: {} chunks within token budget ({} chars)", chunks.size(), totalChars);
        log.info("RAG chunk indices: {}", chunks.stream().map(c -> String.valueOf(c.getChunkIndex())).collect(Collectors.joining(",")));

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
