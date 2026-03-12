package com.infectbyte.botforge.api.chat;

import java.util.UUID;

public record StartChatRequest(UUID botId, String channel) {}
