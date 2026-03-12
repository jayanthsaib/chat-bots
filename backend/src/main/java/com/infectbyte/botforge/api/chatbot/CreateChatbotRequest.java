package com.infectbyte.botforge.api.chatbot;

import jakarta.validation.constraints.NotBlank;

public record CreateChatbotRequest(
        @NotBlank(message = "Chatbot name is required") String name,
        String description,
        String personality,
        String language,
        String welcomeMessage,
        String widgetColor,
        String widgetPosition,
        Boolean collectLead,
        String leadTrigger
) {}
