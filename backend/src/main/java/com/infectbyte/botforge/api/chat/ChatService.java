package com.infectbyte.botforge.api.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.infectbyte.botforge.ai.OpenAIClient;
import com.infectbyte.botforge.api.payment.UsageLimitService;
import com.infectbyte.botforge.ai.RAGService;
import com.infectbyte.botforge.common.ResourceNotFoundException;
import com.infectbyte.botforge.domain.apikey.ApiKey;
import com.infectbyte.botforge.domain.apikey.ApiKeyRepository;
import com.infectbyte.botforge.domain.chatbot.Chatbot;
import com.infectbyte.botforge.domain.chatbot.ChatbotRepository;
import com.infectbyte.botforge.domain.conversation.Conversation;
import com.infectbyte.botforge.domain.conversation.ConversationRepository;
import com.infectbyte.botforge.domain.conversation.Message;
import com.infectbyte.botforge.domain.conversation.MessageRepository;
import com.infectbyte.botforge.domain.lead.Lead;
import com.infectbyte.botforge.domain.lead.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ChatbotRepository chatbotRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final LeadRepository leadRepository;
    private final RAGService ragService;
    private final OpenAIClient openAIClient;
    private final ObjectMapper objectMapper;
    private final UsageLimitService usageLimitService;

    @Transactional
    public StartChatResponse startConversation(UUID tenantId, StartChatRequest request,
                                                String visitorIp, String userAgent) {
        // Resolve chatbot from API key or direct botId
        UUID chatbotId = resolveChatbotId(request);

        chatbotRepository.findByIdAndTenantId(chatbotId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Chatbot", chatbotId));

        String sessionId = "sess_" + UUID.randomUUID().toString().replace("-", "");

        Conversation conversation = Conversation.builder()
                .chatbotId(chatbotId)
                .sessionId(sessionId)
                .channel(request.channel() != null ? request.channel() : "web")
                .visitorIp(visitorIp)
                .visitorUa(userAgent)
                .status("open")
                .build();
        conversation.setTenantId(tenantId);
        conversationRepository.save(conversation);

        Chatbot chatbot = chatbotRepository.findById(chatbotId).orElseThrow();
        return new StartChatResponse(sessionId, chatbot.getWelcomeMessage(), chatbotId);
    }

    public Flux<String> streamResponse(UUID tenantId, ChatMessageRequest request) {
        Conversation conversation = conversationRepository
                .findBySessionIdAndTenantId(request.sessionId(), tenantId)
                .orElseGet(() -> conversationRepository.findBySessionId(request.sessionId())
                        .orElseThrow(() -> new ResourceNotFoundException("Conversation", request.sessionId())));

        UUID chatbotId = conversation.getChatbotId();
        Chatbot chatbot = chatbotRepository.findById(chatbotId)
                .orElseThrow(() -> new ResourceNotFoundException("Chatbot", chatbotId));

        // Check message limit
        usageLimitService.checkAndIncrementMessageCount(tenantId);

        // Sanitize input
        String userMessage = sanitizeInput(request.message());

        // Save user message
        Message userMsg = Message.builder()
                .tenantId(tenantId)
                .conversationId(conversation.getId())
                .role("user")
                .content(userMessage)
                .build();
        messageRepository.save(userMsg);

        // Update conversation last_message_at
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Get conversation history
        List<Message> history = messageRepository.findTop10ByConversationIdOrderByCreatedAtDesc(conversation.getId());
        java.util.Collections.reverse(history);

        // Build RAG prompt
        String systemPrompt = ragService.buildSystemPrompt(chatbotId, tenantId, userMessage, chatbot);
        List<OpenAIClient.ChatMessage> messages = ragService.buildMessageHistory(history);
        // Remove last user msg since we add it separately
        if (!messages.isEmpty() && messages.get(messages.size() - 1).role().equals("user")) {
            messages = messages.subList(0, messages.size() - 1);
        }
        messages = new java.util.ArrayList<>(messages);
        messages.add(new OpenAIClient.ChatMessage("user", userMessage));

        AtomicReference<StringBuilder> responseBuffer = new AtomicReference<>(new StringBuilder());
        AtomicLong startTime = new AtomicLong(System.currentTimeMillis());

        // Determine if lead prompt should be shown (after 3 messages)
        long msgCount = messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conversation.getId()).size();
        boolean shouldPromptLead = chatbot.getCollectLead() &&
                "after_3_messages".equals(chatbot.getLeadTrigger()) &&
                msgCount >= 3 &&
                !leadRepository.findByConversationId(conversation.getId()).isPresent();

        List<OpenAIClient.ChatMessage> finalMessages = messages;
        return openAIClient.streamChat(systemPrompt, finalMessages)
                .doOnNext(token -> responseBuffer.get().append(token))
                .map(token -> {
                    try {
                        return objectMapper.writeValueAsString(new TokenEvent(token));
                    } catch (Exception e) {
                        return "{\"token\":\"" + token + "\"}";
                    }
                })
                .concatWith(Flux.defer(() -> {
                    // Save complete assistant response
                    String fullResponse = responseBuffer.get().toString();
                    int latencyMs = (int) (System.currentTimeMillis() - startTime.get());

                    Message assistantMsg = Message.builder()
                            .tenantId(tenantId)
                            .conversationId(conversation.getId())
                            .role("assistant")
                            .content(fullResponse)
                            .modelUsed("gpt-4o-mini")
                            .latencyMs(latencyMs)
                            .build();
                    messageRepository.save(assistantMsg);

                    try {
                        return Flux.just(objectMapper.writeValueAsString(
                                new DoneEvent("done", shouldPromptLead)));
                    } catch (Exception e) {
                        return Flux.just("{\"type\":\"done\",\"lead_prompt\":false}");
                    }
                }))
                .onErrorResume(e -> {
                    log.error("Error streaming chat response: {}", e.getMessage());
                    return Flux.just("{\"type\":\"error\",\"message\":\"An error occurred\"}");
                });
    }

    public List<MessageDto> getHistory(String sessionId, UUID tenantId) {
        Conversation conversation = conversationRepository
                .findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", sessionId));
        return messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream()
                .map(m -> new MessageDto(m.getId(), m.getRole(), m.getContent(), m.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void saveLead(String sessionId, UUID tenantId, LeadSubmitRequest request) {
        Conversation conversation = conversationRepository
                .findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", sessionId));

        Lead lead = Lead.builder()
                .chatbotId(conversation.getChatbotId())
                .conversationId(conversation.getId())
                .fullName(request.fullName())
                .email(request.email())
                .phone(request.phone())
                .source(conversation.getChannel())
                .status("new")
                .build();
        lead.setTenantId(tenantId);
        leadRepository.save(lead);
    }

    private UUID resolveChatbotId(StartChatRequest request) {
        if (request.botId() != null) return request.botId();

        // Try to get from current auth (API key auth sets details to ApiKey)
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getDetails() instanceof ApiKey apiKey) {
            return apiKey.getChatbotId();
        }
        throw new ResourceNotFoundException("Could not determine chatbot — provide botId");
    }

    private String sanitizeInput(String input) {
        if (input == null) return "";
        String sanitized = input
                .replaceAll("(?i)(ignore|forget|disregard).{0,30}(instructions|prompt|above)", "[removed]")
                .replaceAll("(?i)you are now", "[removed]")
                .replaceAll("(?i)act as a", "[removed]");
        return sanitized.length() > 1000 ? sanitized.substring(0, 1000) : sanitized;
    }

    public record TokenEvent(String token) {}
    public record DoneEvent(String type, boolean lead_prompt) {}
}
