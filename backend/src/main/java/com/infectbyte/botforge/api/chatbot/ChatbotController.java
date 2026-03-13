package com.infectbyte.botforge.api.chatbot;

import com.infectbyte.botforge.common.ApiResponse;
import com.infectbyte.botforge.common.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chatbots")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatbotDto>>> listChatbots() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(chatbotService.listChatbots(tenantId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChatbotDto>> createChatbot(@Valid @RequestBody CreateChatbotRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(chatbotService.createChatbot(tenantId, request), "Chatbot created"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChatbotDto>> getChatbot(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(chatbotService.getChatbot(id, tenantId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ChatbotDto>> updateChatbot(@PathVariable UUID id,
                                                                  @Valid @RequestBody UpdateChatbotRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(chatbotService.updateChatbot(id, tenantId, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteChatbot(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        chatbotService.deleteChatbot(id, tenantId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Chatbot deleted"));
    }

    @GetMapping("/{id}/embed")
    public ResponseEntity<ApiResponse<EmbedCodeResponse>> getEmbedCode(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(chatbotService.generateEmbedCode(id, tenantId)));
    }

    @PostMapping("/{id}/api-key")
    public ResponseEntity<ApiResponse<ApiKeyResponse>> generateApiKey(@PathVariable UUID id,
                                                                       @RequestParam(defaultValue = "Default") String label) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(chatbotService.generateApiKey(id, tenantId, label),
                "API key generated — save it now, it won't be shown again"));
    }
}
