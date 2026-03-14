package com.infectbyte.botforge.ai;

import com.infectbyte.botforge.domain.knowledge.KnowledgeSource;
import com.infectbyte.botforge.domain.knowledge.KnowledgeSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class IngestionPipeline {

    private final KnowledgeSourceRepository sourceRepository;
    private final TextExtractor textExtractor;
    private final EmbeddingService embeddingService;

    @Async
    public void ingestText(KnowledgeSource source, String text) {
        updateStatus(source, "processing");
        try {
            String cleaned = textExtractor.sanitizeText(text);
            embeddingService.embedAndStore(source.getId(), source.getChatbotId(), source.getTenantId(), cleaned);
            log.info("Ingested text source {}", source.getId());
        } catch (Exception e) {
            log.error("Failed to ingest source {}: {}", source.getId(), e.getMessage());
            updateStatus(source, "failed");
        }
    }

    @Async
    public void ingestFaq(KnowledgeSource source, List<FaqItem> faqs) {
        updateStatus(source, "processing");
        try {
            StringBuilder text = new StringBuilder();
            for (FaqItem faq : faqs) {
                text.append("Q: ").append(faq.question()).append("\n");
                text.append("A: ").append(faq.answer()).append("\n\n");
            }
            embeddingService.embedAndStore(source.getId(), source.getChatbotId(), source.getTenantId(),
                    textExtractor.sanitizeText(text.toString()));
            log.info("Ingested FAQ source with {} items", faqs.size());
        } catch (Exception e) {
            log.error("Failed to ingest FAQ source {}: {}", source.getId(), e.getMessage());
            updateStatus(source, "failed");
        }
    }

    @Async
    public void ingestPdf(KnowledgeSource source, InputStream pdfStream) {
        updateStatus(source, "processing");
        try {
            String text = textExtractor.extractFromPdf(pdfStream);
            embeddingService.embedAndStore(source.getId(), source.getChatbotId(), source.getTenantId(),
                    textExtractor.sanitizeText(text));
            log.info("Ingested PDF source {}", source.getId());
        } catch (Exception e) {
            log.error("Failed to ingest PDF source {}: {}", source.getId(), e.getMessage());
            updateStatus(source, "failed");
        }
    }

    @Async
    public void ingestUrl(KnowledgeSource source, int maxPages) {
        updateStatus(source, "processing");
        try {
            String text = maxPages > 1
                    ? textExtractor.crawlWebsite(source.getWebsiteUrl(), maxPages)
                    : textExtractor.extractFromUrl(source.getWebsiteUrl());
            embeddingService.embedAndStore(source.getId(), source.getChatbotId(), source.getTenantId(),
                    textExtractor.sanitizeText(text));
            log.info("Ingested URL source {} ({} max pages)", source.getId(), maxPages);
        } catch (Exception e) {
            log.error("Failed to ingest URL source {}: {}", source.getId(), e.getMessage());
            updateStatus(source, "failed");
        }
    }

    private void updateStatus(KnowledgeSource source, String status) {
        source.setStatus(status);
        sourceRepository.save(source);
    }

    public record FaqItem(String question, String answer) {}
}
