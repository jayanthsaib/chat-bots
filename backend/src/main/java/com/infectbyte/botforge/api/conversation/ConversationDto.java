package com.infectbyte.botforge.api.conversation;

import java.time.LocalDateTime;
import java.util.UUID;

public record ConversationDto(
        UUID id, UUID chatbotId, String sessionId,
        String channel, String status,
        LocalDateTime startedAt, LocalDateTime lastMessageAt
) {}
