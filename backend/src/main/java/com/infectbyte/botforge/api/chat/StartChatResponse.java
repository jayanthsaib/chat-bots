package com.infectbyte.botforge.api.chat;

import java.util.UUID;

public record StartChatResponse(String sessionId, String welcomeMessage, UUID botId) {}
