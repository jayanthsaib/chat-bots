package com.infectbyte.botforge.api.chat;

import com.infectbyte.botforge.common.ApiResponse;
import com.infectbyte.botforge.common.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.PrintWriter;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Slf4j
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

    @PostMapping("/message")
    public void sendMessage(@RequestBody ChatMessageRequest request,
                            HttpServletResponse response) throws Exception {
        UUID tenantId = TenantContext.getTenantId();

        response.setContentType("text/event-stream");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        response.flushBuffer();

        PrintWriter writer = response.getWriter();
        try {
            for (String json : chatService.streamResponse(tenantId, request).toIterable()) {
                writer.write("data:" + json + "\n\n");
                writer.flush();
                if (writer.checkError()) break;
            }
        } catch (Exception e) {
            log.error("SSE streaming error", e);
            writer.write("data:{\"type\":\"error\",\"message\":\"Stream error\"}\n\n");
            writer.flush();
        }
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
