package com.infectbyte.botforge.api.chat;

public record ChatMessageRequest(String sessionId, String message, String channel) {}
