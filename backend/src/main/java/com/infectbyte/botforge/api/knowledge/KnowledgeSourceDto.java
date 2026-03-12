package com.infectbyte.botforge.api.knowledge;

import java.time.LocalDateTime;
import java.util.UUID;

public record KnowledgeSourceDto(
        UUID id,
        UUID chatbotId,
        String sourceType,
        String title,
        String status,
        Integer chunkCount,
        String websiteUrl,
        LocalDateTime createdAt
) {}
