package com.infectbyte.botforge.api.conversation;

import com.infectbyte.botforge.common.ApiResponse;
import com.infectbyte.botforge.common.PageResponse;
import com.infectbyte.botforge.common.ResourceNotFoundException;
import com.infectbyte.botforge.common.TenantContext;
import com.infectbyte.botforge.domain.conversation.Conversation;
import com.infectbyte.botforge.domain.conversation.ConversationRepository;
import com.infectbyte.botforge.domain.conversation.Message;
import com.infectbyte.botforge.domain.conversation.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ConversationDto>>> listConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Conversation> convPage = conversationRepository.findAllByTenantId(
                tenantId, PageRequest.of(page, size, Sort.by("lastMessageAt").descending()));

        PageResponse<ConversationDto> response = PageResponse.<ConversationDto>builder()
                .content(convPage.getContent().stream().map(this::toDto).toList())
                .page(page).size(size)
                .totalElements(convPage.getTotalElements())
                .totalPages(convPage.getTotalPages())
                .last(convPage.isLast())
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationDetailDto>> getConversation(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Conversation conv = conversationRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", id));
        List<Message> messages = messageRepository.findAllByConversationIdOrderByCreatedAtAsc(id);
        return ResponseEntity.ok(ApiResponse.ok(new ConversationDetailDto(toDto(conv),
                messages.stream().map(m -> new MessageItemDto(m.getId(), m.getRole(),
                        m.getContent(), m.getCreatedAt())).toList())));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<ConversationDto>> resolveConversation(@PathVariable UUID id) {
        UUID tenantId = TenantContext.getTenantId();
        Conversation conv = conversationRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", id));
        conv.setStatus("resolved");
        conv.setResolvedAt(LocalDateTime.now());
        return ResponseEntity.ok(ApiResponse.ok(toDto(conversationRepository.save(conv))));
    }

    private ConversationDto toDto(Conversation c) {
        return new ConversationDto(c.getId(), c.getChatbotId(), c.getSessionId(),
                c.getChannel(), c.getStatus(), c.getStartedAt(), c.getLastMessageAt());
    }
}
