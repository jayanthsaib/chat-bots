package com.infectbyte.botforge.api.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.infectbyte.botforge.common.BusinessException;
import com.infectbyte.botforge.common.ResourceNotFoundException;
import com.infectbyte.botforge.config.RazorpayProperties;
import com.infectbyte.botforge.domain.plan.Plan;
import com.infectbyte.botforge.domain.plan.PlanRepository;
import com.infectbyte.botforge.domain.subscription.Subscription;
import com.infectbyte.botforge.domain.subscription.SubscriptionRepository;
import com.infectbyte.botforge.domain.tenant.Tenant;
import com.infectbyte.botforge.domain.tenant.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final TenantRepository tenantRepository;
    private final RazorpayProperties razorpayProperties;
    private final ObjectMapper objectMapper;

    public List<PlanDto> getAllPlans() {
        return planRepository.findAll().stream()
                .map(this::toPlanDto)
                .toList();
    }

    public SubscriptionStatusDto getSubscriptionStatus(UUID tenantId) {
        Subscription sub = subscriptionRepository
                .findTopByTenantIdOrderByCreatedAtDesc(tenantId)
                .orElse(null);

        Plan plan = sub != null && sub.isActive()
                ? sub.getPlan()
                : planRepository.findByName("free").orElseThrow();

        return new SubscriptionStatusDto(
                plan.getName(),
                plan.getDisplayName(),
                plan.getPriceInr(),
                sub != null ? sub.getStatus() : "none",
                sub != null ? sub.getRazorpaySubscriptionId() : null,
                sub != null ? sub.getCurrentPeriodEnd() : null
        );
    }

    @Transactional
    public SubscribeResponse createSubscription(UUID tenantId, String planName) {
        Plan plan = planRepository.findByName(planName)
                .orElseThrow(() -> new ResourceNotFoundException("Plan", planName));

        if ("free".equals(planName)) {
            throw new BusinessException("Cannot subscribe to the free plan");
        }

        if (plan.getRazorpayPlanId() == null || plan.getRazorpayPlanId().isBlank()) {
            throw new BusinessException("This plan is not configured for payments yet. Please contact support.");
        }

        try {
            com.razorpay.RazorpayClient client = new com.razorpay.RazorpayClient(
                    razorpayProperties.getKeyId(), razorpayProperties.getKeySecret());

            JSONObject request = new JSONObject();
            request.put("plan_id", plan.getRazorpayPlanId());
            request.put("total_count", 12); // 12 billing cycles
            request.put("quantity", 1);

            com.razorpay.Subscription razorpaySub = client.subscriptions.create(request);
            String razorpaySubId = razorpaySub.get("id");

            Subscription subscription = Subscription.builder()
                    .tenantId(tenantId)
                    .plan(plan)
                    .razorpaySubscriptionId(razorpaySubId)
                    .status("created")
                    .build();
            subscriptionRepository.save(subscription);

            return new SubscribeResponse(razorpaySubId, razorpayProperties.getKeyId());

        } catch (com.razorpay.RazorpayException e) {
            log.error("Razorpay error creating subscription for tenant {}: {}", tenantId, e.getMessage());
            throw new BusinessException("Failed to create subscription. Please try again.");
        }
    }

    @Transactional
    public void handleWebhook(String payload, String signature) {
        // Verify webhook signature
        if (!verifySignature(payload, signature, razorpayProperties.getWebhookSecret())) {
            log.warn("Invalid Razorpay webhook signature");
            throw new BusinessException("Invalid webhook signature");
        }

        try {
            JsonNode event = objectMapper.readTree(payload);
            String eventType = event.path("event").asText();
            JsonNode subscriptionNode = event.path("payload").path("subscription").path("entity");

            String razorpaySubId = subscriptionNode.path("id").asText();
            log.info("Razorpay webhook: event={} subscriptionId={}", eventType, razorpaySubId);

            Subscription sub = subscriptionRepository
                    .findByRazorpaySubscriptionId(razorpaySubId)
                    .orElse(null);

            if (sub == null) {
                log.warn("Received webhook for unknown subscription: {}", razorpaySubId);
                return;
            }

            switch (eventType) {
                case "subscription.activated", "subscription.charged" -> {
                    sub.setStatus("active");
                    long periodStart = subscriptionNode.path("current_start").asLong(0);
                    long periodEnd = subscriptionNode.path("current_end").asLong(0);
                    if (periodStart > 0)
                        sub.setCurrentPeriodStart(LocalDateTime.ofInstant(Instant.ofEpochSecond(periodStart), ZoneId.of("UTC")));
                    if (periodEnd > 0)
                        sub.setCurrentPeriodEnd(LocalDateTime.ofInstant(Instant.ofEpochSecond(periodEnd), ZoneId.of("UTC")));

                    subscriptionRepository.save(sub);
                    updateTenantPlan(sub.getTenantId(), sub.getPlan().getName());
                    log.info("Subscription {} activated for tenant {}", razorpaySubId, sub.getTenantId());
                }
                case "subscription.cancelled" -> {
                    sub.setStatus("cancelled");
                    subscriptionRepository.save(sub);
                    updateTenantPlan(sub.getTenantId(), "free");
                    log.info("Subscription {} cancelled for tenant {}", razorpaySubId, sub.getTenantId());
                }
                case "subscription.halted" -> {
                    sub.setStatus("halted");
                    subscriptionRepository.save(sub);
                    updateTenantPlan(sub.getTenantId(), "free");
                    log.info("Subscription {} halted (payment failed) for tenant {}", razorpaySubId, sub.getTenantId());
                }
                default -> log.debug("Unhandled Razorpay event: {}", eventType);
            }

        } catch (Exception e) {
            log.error("Error processing Razorpay webhook: {}", e.getMessage(), e);
            throw new BusinessException("Webhook processing failed");
        }
    }

    @Transactional
    public void cancelSubscription(UUID tenantId) {
        Subscription sub = subscriptionRepository
                .findTopByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, "active")
                .orElseThrow(() -> new BusinessException("No active subscription found"));

        try {
            com.razorpay.RazorpayClient client = new com.razorpay.RazorpayClient(
                    razorpayProperties.getKeyId(), razorpayProperties.getKeySecret());

            JSONObject cancelRequest = new JSONObject();
            cancelRequest.put("cancel_at_cycle_end", 1); // cancel at end of billing cycle
            client.subscriptions.cancel(sub.getRazorpaySubscriptionId(), cancelRequest);

            sub.setStatus("cancelled");
            subscriptionRepository.save(sub);
            updateTenantPlan(tenantId, "free");

        } catch (com.razorpay.RazorpayException e) {
            log.error("Razorpay error cancelling subscription: {}", e.getMessage());
            throw new BusinessException("Failed to cancel subscription. Please try again.");
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void updateTenantPlan(UUID tenantId, String planName) {
        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            tenant.setPlan(planName);
            tenantRepository.save(tenant);
        });
    }

    private boolean verifySignature(String payload, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(hash);
            return expected.equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("Signature verification error: {}", e.getMessage());
            return false;
        }
    }

    private PlanDto toPlanDto(Plan p) {
        return new PlanDto(p.getId(), p.getName(), p.getDisplayName(), p.getPriceInr(),
                p.getMaxBots(), p.getMaxMessagesPerMonth(), p.getMaxKnowledgeSources());
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record PlanDto(UUID id, String name, String displayName, int priceInr,
                          int maxBots, int maxMessagesPerMonth, int maxKnowledgeSources) {}

    public record SubscribeResponse(String subscriptionId, String keyId) {}

    public record SubscribeRequest(String planName) {}

    public record SubscriptionStatusDto(String planName, String displayName, int priceInr,
                                        String status, String razorpaySubscriptionId,
                                        LocalDateTime currentPeriodEnd) {}
}
