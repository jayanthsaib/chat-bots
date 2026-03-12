package com.infectbyte.botforge.ai;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TextChunker {

    private static final int TARGET_TOKENS = 500;
    private static final int OVERLAP_TOKENS = 50;
    // Rough estimate: 1 token ≈ 4 characters
    private static final int CHARS_PER_TOKEN = 4;

    public List<String> chunk(String text) {
        if (text == null || text.isBlank()) return List.of();

        List<String> chunks = new ArrayList<>();
        String[] paragraphs = text.split("\n\n+");
        StringBuilder currentChunk = new StringBuilder();
        int currentTokens = 0;
        String lastParagraph = "";

        for (String paragraph : paragraphs) {
            if (paragraph.isBlank()) continue;

            int paraTokens = estimateTokens(paragraph);

            if (currentTokens + paraTokens > TARGET_TOKENS && currentTokens > 0) {
                chunks.add(currentChunk.toString().trim());
                // Start new chunk with overlap from last paragraph
                currentChunk = new StringBuilder(lastParagraph);
                currentTokens = estimateTokens(lastParagraph);
            }

            if (!currentChunk.isEmpty()) {
                currentChunk.append("\n\n");
            }
            currentChunk.append(paragraph);
            currentTokens += paraTokens;
            lastParagraph = paragraph;
        }

        if (!currentChunk.isEmpty()) {
            chunks.add(currentChunk.toString().trim());
        }

        return chunks;
    }

    public int estimateTokens(String text) {
        return Math.max(1, text.length() / CHARS_PER_TOKEN);
    }
}
