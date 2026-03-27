package com.infectbyte.botforge.api.analytics;

import com.infectbyte.botforge.common.ApiResponse;
import com.infectbyte.botforge.common.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AnalyticsDto>> getOverview() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(analyticsService.getOverview(tenantId)));
    }
}
