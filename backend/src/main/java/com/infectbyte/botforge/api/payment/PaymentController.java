package com.infectbyte.botforge.api.payment;

import com.infectbyte.botforge.common.ApiResponse;
import com.infectbyte.botforge.common.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final UsageLimitService usageLimitService;

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<PaymentService.PlanDto>>> getPlans() {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getAllPlans()));
    }

    @GetMapping("/payments/subscription")
    public ResponseEntity<ApiResponse<PaymentService.SubscriptionStatusDto>> getSubscriptionStatus() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getSubscriptionStatus(tenantId)));
    }

    @GetMapping("/payments/usage")
    public ResponseEntity<ApiResponse<UsageDto>> getUsage() {
        UUID tenantId = TenantContext.getTenantId();
        var plan = usageLimitService.getActivePlan(tenantId);
        long bots = usageLimitService.getBotCount(tenantId);
        long messages = usageLimitService.getMessageCountThisMonth(tenantId);
        long knowledgeSources = usageLimitService.getKnowledgeSourceCount(tenantId);
        return ResponseEntity.ok(ApiResponse.ok(new UsageDto(bots, plan.getMaxBots(),
                messages, plan.getMaxMessagesPerMonth(),
                knowledgeSources, plan.getMaxKnowledgeSources())));
    }

    @PostMapping("/payments/subscribe")
    public ResponseEntity<ApiResponse<PaymentService.SubscribeResponse>> subscribe(
            @RequestBody PaymentService.SubscribeRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(ApiResponse.ok(paymentService.createSubscription(tenantId, request.planName())));
    }

    @PostMapping("/payments/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelSubscription() {
        UUID tenantId = TenantContext.getTenantId();
        paymentService.cancelSubscription(tenantId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Subscription cancelled successfully"));
    }

    // Webhook — public endpoint, verified by signature inside PaymentService
    @PostMapping("/payments/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.handleWebhook(payload, signature != null ? signature : "");
        return ResponseEntity.ok("ok");
    }

    public record UsageDto(long botsUsed, int maxBots, long messagesThisMonth, int maxMessages,
                           long knowledgeSourcesUsed, int maxKnowledgeSources) {}
}
