package com.infectbyte.botforge.api.knowledge;

import com.infectbyte.botforge.ai.IngestionPipeline;
import com.infectbyte.botforge.common.ApiResponse;
import com.infectbyte.botforge.common.ResourceNotFoundException;
import com.infectbyte.botforge.common.TenantContext;
import com.infectbyte.botforge.domain.chatbot.ChatbotRepository;
import com.infectbyte.botforge.domain.knowledge.KnowledgeSource;
import com.infectbyte.botforge.domain.knowledge.KnowledgeSourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chatbots/{chatbotId}/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeSourceRepository sourceRepository;
    private final ChatbotRepository chatbotRepository;
    private final IngestionPipeline ingestionPipeline;

    @GetMapping
    public ResponseEntity<ApiResponse<List<KnowledgeSourceDto>>> listSources(@PathVariable UUID chatbotId) {
        UUID tenantId = TenantContext.getTenantId();
        validateChatbot(chatbotId, tenantId);
        List<KnowledgeSourceDto> sources = sourceRepository.findAllByChatbotIdAndTenantId(chatbotId, tenantId)
                .stream().map(this::toDto).toList();
        return ResponseEntity.ok(ApiResponse.ok(sources));
    }

    @PostMapping("/text")
    public ResponseEntity<ApiResponse<KnowledgeSourceDto>> addText(@PathVariable UUID chatbotId,
                                                                     @RequestBody Map<String, String> body) {
        UUID tenantId = TenantContext.getTenantId();
        validateChatbot(chatbotId, tenantId);

        KnowledgeSource source = KnowledgeSource.builder()
                .chatbotId(chatbotId)
                .sourceType("text")
                .title(body.getOrDefault("title", "Text Content"))
                .originalContent(body.get("content"))
                .build();
        source.setTenantId(tenantId);
        source = sourceRepository.save(source);

        ingestionPipeline.ingestText(source, body.get("content"));
        return ResponseEntity.ok(ApiResponse.ok(toDto(source), "Text submitted for indexing"));
    }

    @PostMapping("/faq")
    public ResponseEntity<ApiResponse<KnowledgeSourceDto>> addFaq(@PathVariable UUID chatbotId,
                                                                    @RequestBody FaqRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        validateChatbot(chatbotId, tenantId);

        StringBuilder content = new StringBuilder();
        for (FaqRequest.FaqItem item : request.faqs()) {
            content.append("Q: ").append(item.question()).append("\n");
            content.append("A: ").append(item.answer()).append("\n\n");
        }

        KnowledgeSource source = KnowledgeSource.builder()
                .chatbotId(chatbotId)
                .sourceType("faq")
                .title(request.title() != null ? request.title() : "FAQ")
                .originalContent(content.toString())
                .build();
        source.setTenantId(tenantId);
        source = sourceRepository.save(source);

        KnowledgeSource finalSource = source;
        List<IngestionPipeline.FaqItem> faqItems = request.faqs().stream()
                .map(f -> new IngestionPipeline.FaqItem(f.question(), f.answer()))
                .toList();
        ingestionPipeline.ingestFaq(finalSource, faqItems);
        return ResponseEntity.ok(ApiResponse.ok(toDto(source), "FAQ submitted for indexing"));
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<KnowledgeSourceDto>> uploadFile(@PathVariable UUID chatbotId,
                                                                        @RequestParam("file") MultipartFile file) throws IOException {
        UUID tenantId = TenantContext.getTenantId();
        validateChatbot(chatbotId, tenantId);

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.toLowerCase().endsWith(".pdf") &&
                !filename.toLowerCase().endsWith(".txt"))) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Only PDF and TXT files are supported"));
        }

        KnowledgeSource source = KnowledgeSource.builder()
                .chatbotId(chatbotId)
                .sourceType("document")
                .title(filename)
                .build();
        source.setTenantId(tenantId);
        source = sourceRepository.save(source);

        if (filename.toLowerCase().endsWith(".pdf")) {
            ingestionPipeline.ingestPdf(source, file.getInputStream());
        } else {
            String text = new String(file.getBytes());
            ingestionPipeline.ingestText(source, text);
        }
        return ResponseEntity.ok(ApiResponse.ok(toDto(source), "File submitted for indexing"));
    }

    @PostMapping("/url")
    public ResponseEntity<ApiResponse<KnowledgeSourceDto>> addUrl(@PathVariable UUID chatbotId,
                                                                    @RequestBody Map<String, String> body) {
        UUID tenantId = TenantContext.getTenantId();
        validateChatbot(chatbotId, tenantId);

        String url = body.get("url") != null ? body.get("url").trim() : null;
        int maxPages = 1;
        try { maxPages = Math.min(50, Math.max(1, Integer.parseInt(body.getOrDefault("maxPages", "1")))); }
        catch (NumberFormatException ignored) {}

        KnowledgeSource source = KnowledgeSource.builder()
                .chatbotId(chatbotId)
                .sourceType("website_url")
                .title(body.getOrDefault("title", url))
                .websiteUrl(url)
                .build();
        source.setTenantId(tenantId);
        source = sourceRepository.save(source);

        ingestionPipeline.ingestUrl(source, maxPages);
        String msg = maxPages > 1 ? "Crawling up to " + maxPages + " pages..." : "URL submitted for indexing";
        return ResponseEntity.ok(ApiResponse.ok(toDto(source), msg));
    }

    @DeleteMapping("/{sourceId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Void>> deleteSource(@PathVariable UUID chatbotId,
                                                           @PathVariable UUID sourceId) {
        UUID tenantId = TenantContext.getTenantId();
        validateChatbot(chatbotId, tenantId);
        sourceRepository.deleteByIdAndTenantId(sourceId, tenantId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Source deleted"));
    }

    private void validateChatbot(UUID chatbotId, UUID tenantId) {
        if (!chatbotRepository.existsByIdAndTenantId(chatbotId, tenantId)) {
            throw new ResourceNotFoundException("Chatbot", chatbotId);
        }
    }

    private KnowledgeSourceDto toDto(KnowledgeSource s) {
        return new KnowledgeSourceDto(s.getId(), s.getChatbotId(), s.getSourceType(),
                s.getTitle(), s.getStatus(), s.getChunkCount(),
                s.getWebsiteUrl(), s.getCreatedAt());
    }
}
