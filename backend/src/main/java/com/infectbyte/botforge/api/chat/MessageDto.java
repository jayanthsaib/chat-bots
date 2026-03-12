package com.infectbyte.botforge.api.chat;

import java.time.LocalDateTime;
import java.util.UUID;

public record MessageDto(UUID id, String role, String content, LocalDateTime createdAt) {}
