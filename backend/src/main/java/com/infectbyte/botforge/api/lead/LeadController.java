package com.infectbyte.botforge.api.lead;

import com.infectbyte.botforge.common.ApiResponse;
import com.infectbyte.botforge.common.PageResponse;
import com.infectbyte.botforge.common.ResourceNotFoundException;
import com.infectbyte.botforge.common.TenantContext;
import com.infectbyte.botforge.domain.lead.Lead;
import com.infectbyte.botforge.domain.lead.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
public class LeadController {

    private final LeadRepository leadRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<LeadDto>>> listLeads(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID tenantId = TenantContext.getTenantId();
        Page<Lead> leadPage = leadRepository.findAllByTenantId(tenantId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        PageResponse<LeadDto> response = PageResponse.<LeadDto>builder()
                .content(leadPage.getContent().stream().map(this::toDto).toList())
                .page(page).size(size)
                .totalElements(leadPage.getTotalElements())
                .totalPages(leadPage.getTotalPages())
                .last(leadPage.isLast())
                .build();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<LeadDto>> updateLead(@PathVariable UUID id,
                                                            @RequestBody Map<String, String> updates) {
        UUID tenantId = TenantContext.getTenantId();
        Lead lead = leadRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead", id));

        if (updates.containsKey("status")) lead.setStatus(updates.get("status"));
        if (updates.containsKey("notes")) lead.setNotes(updates.get("notes"));

        return ResponseEntity.ok(ApiResponse.ok(toDto(leadRepository.save(lead))));
    }

    private LeadDto toDto(Lead l) {
        return new LeadDto(l.getId(), l.getChatbotId(), l.getConversationId(),
                l.getFullName(), l.getEmail(), l.getPhone(),
                l.getSource(), l.getIntent(), l.getStatus(),
                l.getNotes(), l.getCreatedAt());
    }
}
