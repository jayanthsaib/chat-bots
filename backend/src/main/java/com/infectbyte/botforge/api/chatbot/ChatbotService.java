package com.infectbyte.botforge.api.chatbot;

import com.infectbyte.botforge.api.payment.UsageLimitService;
import com.infectbyte.botforge.common.ResourceNotFoundException;
import com.infectbyte.botforge.domain.apikey.ApiKey;
import com.infectbyte.botforge.domain.apikey.ApiKeyRepository;
import com.infectbyte.botforge.domain.chatbot.Chatbot;
import com.infectbyte.botforge.domain.chatbot.ChatbotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatbotRepository chatbotRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;
    private final UsageLimitService usageLimitService;

    @Value("${server.port:8080}")
    private String serverPort;

    public List<ChatbotDto> listChatbots(UUID tenantId) {
        return chatbotRepository.findAllByTenantId(tenantId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ChatbotDto createChatbot(UUID tenantId, CreateChatbotRequest request) {
        usageLimitService.checkBotLimit(tenantId);
        Chatbot chatbot = Chatbot.builder()
                .name(request.name())
                .description(request.description())
                .personality(request.personality())
                .language(request.language() != null ? request.language() : "en")
                .welcomeMessage(request.welcomeMessage() != null ? request.welcomeMessage() : "Hi! How can I help you today?")
                .widgetColor(request.widgetColor() != null ? request.widgetColor() : "#4F46E5")
                .widgetPosition(request.widgetPosition() != null ? request.widgetPosition() : "bottom-right")
                .collectLead(request.collectLead() != null ? request.collectLead() : true)
                .leadTrigger(request.leadTrigger() != null ? request.leadTrigger() : "after_3_messages")
                .status("draft")
                .build();
        chatbot.setTenantId(tenantId);
        return toDto(chatbotRepository.save(chatbot));
    }

    public ChatbotDto getChatbot(UUID id, UUID tenantId) {
        return toDto(chatbotRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Chatbot", id)));
    }

    @Transactional
    public ChatbotDto updateChatbot(UUID id, UUID tenantId, UpdateChatbotRequest request) {
        Chatbot chatbot = chatbotRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Chatbot", id));

        if (request.name() != null) chatbot.setName(request.name());
        if (request.description() != null) chatbot.setDescription(request.description());
        if (request.personality() != null) chatbot.setPersonality(request.personality());
        if (request.language() != null) chatbot.setLanguage(request.language());
        if (request.status() != null) chatbot.setStatus(request.status());
        if (request.widgetColor() != null) chatbot.setWidgetColor(request.widgetColor());
        if (request.widgetPosition() != null) chatbot.setWidgetPosition(request.widgetPosition());
        if (request.welcomeMessage() != null) chatbot.setWelcomeMessage(request.welcomeMessage());
        if (request.fallbackMessage() != null) chatbot.setFallbackMessage(request.fallbackMessage());
        if (request.collectLead() != null) chatbot.setCollectLead(request.collectLead());
        if (request.leadTrigger() != null) chatbot.setLeadTrigger(request.leadTrigger());

        return toDto(chatbotRepository.save(chatbot));
    }

    @Transactional
    public void deleteChatbot(UUID id, UUID tenantId) {
        if (!chatbotRepository.existsByIdAndTenantId(id, tenantId)) {
            throw new ResourceNotFoundException("Chatbot", id);
        }
        chatbotRepository.deleteById(id);
    }

    public EmbedCodeResponse generateEmbedCode(UUID id, UUID tenantId) {
        Chatbot chatbot = chatbotRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Chatbot", id));

        List<ApiKey> keys = apiKeyRepository.findAllByChatbotId(id);
        String apiKey = keys.isEmpty() ? "(generate an API key first)" : keys.get(0).getKeyPrefix() + "...";

        String embedCode = """
                <script>
                  window.BotForgeConfig = {
                    apiKey: "%s",
                    botId: "%s"
                  };
                </script>
                <script src="http://localhost:%s/widget/botforge-widget.min.js" async></script>
                """.formatted(apiKey, id, serverPort);

        return new EmbedCodeResponse(id, chatbot.getName(), embedCode);
    }

    @Transactional
    public ApiKeyResponse generateApiKey(UUID chatbotId, UUID tenantId, String label) {
        chatbotRepository.findByIdAndTenantId(chatbotId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Chatbot", chatbotId));

        // Generate: bf_live_ + 32 random URL-safe chars
        byte[] bytes = new byte[24];
        new SecureRandom().nextBytes(bytes);
        String randomPart = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String plainKey = "bf_live_" + randomPart;
        String prefix = plainKey.substring(0, 16);

        ApiKey apiKey = ApiKey.builder()
                .tenantId(tenantId)
                .chatbotId(chatbotId)
                .keyHash(passwordEncoder.encode(plainKey))
                .keyPrefix(prefix)
                .label(label)
                .build();
        apiKeyRepository.save(apiKey);

        return new ApiKeyResponse(apiKey.getId(), plainKey, prefix, label);
    }

    private ChatbotDto toDto(Chatbot c) {
        return new ChatbotDto(
                c.getId(), c.getTenantId(), c.getName(), c.getDescription(),
                c.getPersonality(), c.getLanguage(), c.getStatus(),
                c.getWidgetColor(), c.getWidgetPosition(), c.getWelcomeMessage(),
                c.getFallbackMessage(), c.getCollectLead(), c.getLeadTrigger(),
                c.getHandoffEnabled(), c.getCreatedAt(), c.getUpdatedAt()
        );
    }
}
