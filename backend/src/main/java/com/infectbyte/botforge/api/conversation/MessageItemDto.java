package com.infectbyte.botforge.api.conversation;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageItemDto(UUID id, String role, String content, LocalDateTime createdAt) {}
