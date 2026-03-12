package com.infectbyte.botforge.api.chat;

import com.infectbyte.botforge.common.ApiResponse;
import com.infectbyte.botforge.common.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<StartChatResponse>> startChat(
            @RequestBody StartChatRequest request,
            HttpServletRequest httpRequest) {
        UUID tenantId = TenantContext.getTenantId();
        String visitorIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        return ResponseEntity.ok(ApiResponse.ok(
                chatService.startConversation(tenantId, request, visitorIp, userAgent)));
    }

    @PostMapping(value = "/message", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> sendMessage(@RequestBody ChatMessageRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        return chatService.streamResponse(tenantId, request);
    }

    @GetMapping("/{sessionId}/history")
    public ResponseEntity<ApiResponse<List<MessageDto>>> getHistory(@PathVariable String sessionId) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(chatService.getHistory(sessionId, tenantId)));
    }

    @PostMapping("/{sessionId}/lead")
    public ResponseEntity<ApiResponse<Void>> submitLead(@PathVariable String sessionId,
                                                         @RequestBody LeadSubmitRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        chatService.saveLead(sessionId, tenantId, request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Lead saved"));
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
