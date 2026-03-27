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
            1. GREETINGS FIRST: If the user sends any greeting or small talk in ANY language (hi, hello, hey, thanks, bye, namaste, namsthe, vanakkam, salaam, hola, bonjour, or any informal opener) — ALWAYS respond warmly and naturally. NEVER say "I don't have that information" for a greeting. This rule overrides everything else.
            2. CROSS-LANGUAGE UNDERSTANDING: The user may ask in any language (Telugu, Hindi, Arabic, Tamil, etc.). The knowledge base is in English. Understand the MEANING and INTENT of the question regardless of the language it is written in. Search for the answer in the RELEVANT KNOWLEDGE section by meaning, not by matching words literally. Example: "ei company cto evaru?" means "who is the CTO of this company?" — find the CTO information in the knowledge and answer in Telugu.
            3. For any factual question about the business, products, services, or specific information — answer using the RELEVANT KNOWLEDGE section below.
            4. For vague follow-ups like "details?", "more?", "explain" — use the conversation history to understand what the user is asking about and answer from the knowledge.
            5. If the answer is truly NOT found anywhere in the RELEVANT KNOWLEDGE section, respond in the user's language:
               "I don't have that information. Please contact our team for help."
               Do NOT use your general training knowledge to answer factual questions.
            6. Be friendly, concise, and professional.
            7. If the user wants to book an appointment, collect their name and preferred date/time.
            8. If the user shows buying intent or asks for pricing, offer to capture their contact info.
            9. Language: ALWAYS respond in the same language the user wrote in. Telugu → Telugu. Hindi → Hindi. Arabic → Arabic. English → English. Never switch languages unless the user does.
            10. Keep responses concise — 2-4 sentences when possible.

            RELEVANT KNOWLEDGE:
            %s
            """;

    public record SourceCitation(String title, String url) {}
    public record RAGResult(String systemPrompt, boolean hasKnowledge, List<SourceCitation> sources) {}

    public RAGResult buildPrompt(UUID chatbotId, UUID tenantId, String userMessage,
                                  Chatbot chatbot) {
        // For cross-language queries: extract ASCII portion for semantic embedding.
        // "ei company cto evaru?" → "ei company cto evaru" (better vector match against English KB)
        String asciiPart = userMessage.toLowerCase().replaceAll("[^a-z0-9 ]", " ").trim();
        String semanticQuery = asciiPart.length() >= 3 ? asciiPart : userMessage;

        // Embed user query
        float[] queryVector = embeddingService.embedQuery(semanticQuery);
        String vectorStr = toVectorString(queryVector);

        // Semantic search: top 10 above threshold (leaves room for keyword supplements)
        List<KnowledgeChunk> chunks = new java.util.ArrayList<>(chunkRepository.findSimilarChunksAboveThreshold(
                chatbotId, tenantId, vectorStr, 10, SIMILARITY_THRESHOLD));
        log.info("RAG: found {} semantic chunks (threshold={}) for query: {}", chunks.size(), SIMILARITY_THRESHOLD, userMessage);

        // Keyword supplement: always add keyword-matched chunks not already in results
        // Use ASCII-only words to avoid non-Latin words flooding the budget
        java.util.Set<String> stopWords = java.util.Set.of(
            "who", "what", "where", "when", "how", "why", "which", "the", "and",
            "for", "are", "you", "tell", "can", "give", "does", "did", "has",
            "have", "its", "this", "that", "with", "from", "about", "your",
            "company", "please", "want", "need", "get", "let", "know", "any"
        );
        String[] words = asciiPart.trim().split("\\s+");
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
                : "[NO KNOWLEDGE AVAILABLE — For factual questions about the business, say you don't have that information. For greetings or small talk, respond naturally and warmly.]";

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
