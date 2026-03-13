package com.infectbyte.botforge.api.chatbot;

import java.util.UUID;

public record ApiKeyResponse(UUID id, String apiKey, String prefix, String label) {}
