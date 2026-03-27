package com.infectbyte.botforge.ai;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TextChunker {

    private static final int MAX_TOKENS = 300;
    private static final int MIN_TOKENS = 30;
    // Rough estimate: 1 token ≈ 4 characters
    private static final int CHARS_PER_TOKEN = 4;

    public List<String> chunk(String text) {
        if (text == null || text.isBlank()) return List.of();

        // Step 1: Split into sections by headings, then by paragraphs within each section
        List<String> sections = splitIntoSections(text);

        // Step 2: For each section, apply token-based splitting if too large
        List<String> chunks = new ArrayList<>();
        for (String section : sections) {
            if (estimateTokens(section) <= MAX_TOKENS) {
                if (estimateTokens(section) >= MIN_TOKENS) {
                    chunks.add(section.trim());
                }
            } else {
                chunks.addAll(splitByTokens(section));
            }
        }

        return chunks;
    }

    /**
     * Split text into semantic sections. A new section starts when a heading-like line is detected
     * (short line, no trailing period, not a bullet point).
     * Short sections (below MIN_TOKENS) are merged into the next section so names/titles
     * stay attached to their content.
     */
    private List<String> splitIntoSections(String text) {
        List<String> rawSections = new ArrayList<>();
        String[] lines = text.split("\n");
        StringBuilder current = new StringBuilder();

        for (String line : lines) {
            String trimmed = line.trim();
            if (isHeading(trimmed) && current.length() > 0) {
                String section = current.toString().trim();
                if (!section.isBlank()) rawSections.add(section);
                current = new StringBuilder();
            }
            current.append(line).append("\n");
        }
        if (!current.isEmpty()) {
            String section = current.toString().trim();
            if (!section.isBlank()) rawSections.add(section);
        }

        // Merge sections that are too short into the next one (keeps name + title + bio together)
        List<String> sections = new ArrayList<>();
        StringBuilder pending = new StringBuilder();
        for (String section : rawSections) {
            if (estimateTokens(section) < MIN_TOKENS) {
                // Too short — carry it forward and prepend to next section
                if (!pending.isEmpty()) pending.append("\n\n");
                pending.append(section);
            } else {
                String combined = pending.isEmpty() ? section : pending + "\n\n" + section;
                sections.add(combined);
                pending = new StringBuilder();
            }
        }
        // Flush any remaining pending content
        if (!pending.isEmpty()) sections.add(pending.toString());

        if (sections.isEmpty() && !text.isBlank()) {
            sections.add(text.trim());
        }

        return sections;
    }

    /**
     * Heuristic: a line is a heading if it is short (≤80 chars), non-empty,
     * doesn't end with a sentence-ending punctuation, and isn't a bullet point.
     */
    private boolean isHeading(String line) {
        if (line.isBlank() || line.length() > 80) return false;
        if (line.startsWith("—") || line.startsWith("-") || line.startsWith("•")
                || line.startsWith("*") || line.startsWith("Q:") || line.startsWith("A:")) return false;
        if (line.endsWith(".") || line.endsWith("?") || line.endsWith("!") || line.endsWith(",")) return false;
        // Must have at least 3 characters
        return line.length() >= 3;
    }

    /**
     * Split a large section into token-sized chunks with paragraph boundaries.
     */
    private List<String> splitByTokens(String text) {
        List<String> chunks = new ArrayList<>();
        String[] paragraphs = text.split("\n\n+");
        StringBuilder current = new StringBuilder();
        int currentTokens = 0;

        for (String paragraph : paragraphs) {
            if (paragraph.isBlank()) continue;
            int paraTokens = estimateTokens(paragraph);

            if (currentTokens + paraTokens > MAX_TOKENS && currentTokens >= MIN_TOKENS) {
                chunks.add(current.toString().trim());
                current = new StringBuilder();
                currentTokens = 0;
            }

            if (!current.isEmpty()) current.append("\n\n");
            current.append(paragraph);
            currentTokens += paraTokens;
        }

        if (!current.isEmpty() && estimateTokens(current.toString()) >= MIN_TOKENS) {
            chunks.add(current.toString().trim());
        }

        return chunks;
    }

    public int estimateTokens(String text) {
        return Math.max(1, text.length() / CHARS_PER_TOKEN);
    }
}
