package com.infectbyte.botforge.api.chatbot;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatbotDto(
        UUID id,
        UUID tenantId,
        String name,
        String description,
        String personality,
        String language,
        String status,
        String widgetColor,
        String widgetPosition,
        String welcomeMessage,
        String fallbackMessage,
        Boolean collectLead,
        String leadTrigger,
        Boolean handoffEnabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
