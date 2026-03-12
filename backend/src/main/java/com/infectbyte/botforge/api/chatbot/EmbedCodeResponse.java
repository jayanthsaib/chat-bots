package com.infectbyte.botforge.api.chatbot;

import java.util.UUID;

public record EmbedCodeResponse(UUID botId, String botName, String embedCode) {}
