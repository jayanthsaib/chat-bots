package com.infectbyte.botforge.api.lead;

import java.time.LocalDateTime;
import java.util.UUID;

public record LeadDto(
        UUID id, UUID chatbotId, UUID conversationId,
        String fullName, String email, String phone,
        String source, String intent, String status,
        String notes, LocalDateTime createdAt
) {}
