package com.infectbyte.botforge.api.chatbot;

public record UpdateChatbotRequest(
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
        Boolean handoffEnabled
) {}
