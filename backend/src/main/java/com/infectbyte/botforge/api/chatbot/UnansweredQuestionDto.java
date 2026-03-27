package com.infectbyte.botforge.api.chatbot;

import java.time.LocalDateTime;

public record UnansweredQuestionDto(
        String userQuestion,
        String botResponse,
        LocalDateTime askedAt
) {}
