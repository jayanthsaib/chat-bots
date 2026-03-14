package com.infectbyte.botforge.api.payment;

import com.infectbyte.botforge.common.PlanLimitExceededException;
import com.infectbyte.botforge.domain.chatbot.ChatbotRepository;
import com.infectbyte.botforge.domain.knowledge.KnowledgeSourceRepository;
import com.infectbyte.botforge.domain.plan.Plan;
import com.infectbyte.botforge.domain.plan.PlanRepository;
import com.infectbyte.botforge.domain.subscription.Subscription;
import com.infectbyte.botforge.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.concurrent.TimeUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsageLimitService {

    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final ChatbotRepository chatbotRepository;
    private final KnowledgeSourceRepository knowledgeSourceRepository;
    private final StringRedisTemplate redisTemplate;

    // ── Plan resolution ──────────────────────────────────────────────────────

    public Plan getActivePlan(UUID tenantId) {
        return subscriptionRepository
                .findTopByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, "active")
                .map(Subscription::getPlan)
                .orElseGet(() -> planRepository.findByName("free")
                        .orElseThrow(() -> new IllegalStateException("Free plan not found in DB")));
    }

    // ── Limit checks ─────────────────────────────────────────────────────────

    public void checkBotLimit(UUID tenantId) {
        Plan plan = getActivePlan(tenantId);
        if (plan.isUnlimited(plan.getMaxBots())) return;

        long currentBots = chatbotRepository.countByTenantId(tenantId);
        if (currentBots >= plan.getMaxBots()) {
            throw new PlanLimitExceededException(
                    "You have reached the chatbot limit for your " + plan.getDisplayName() +
                    " plan (" + plan.getMaxBots() + " bots). Please upgrade to create more.");
        }
    }

    public void checkKnowledgeSourceLimit(UUID tenantId, UUID chatbotId) {
        Plan plan = getActivePlan(tenantId);
        if (plan.isUnlimited(plan.getMaxKnowledgeSources())) return;

        long current = knowledgeSourceRepository.countByChatbotId(chatbotId);
        if (current >= plan.getMaxKnowledgeSources()) {
            throw new PlanLimitExceededException(
                    "You have reached the knowledge source limit for your " + plan.getDisplayName() +
                    " plan (" + plan.getMaxKnowledgeSources() + " sources). Please upgrade to add more.");
        }
    }

    public void checkAndIncrementMessageCount(UUID tenantId) {
        Plan plan = getActivePlan(tenantId);
        if (plan.isUnlimited(plan.getMaxMessagesPerMonth())) return;

        String key = messageCountKey(tenantId);
        Long count = redisTemplate.opsForValue().increment(key);
        if (count == 1) {
            // First message this month — set TTL to 60 days
            redisTemplate.expire(key, 60, TimeUnit.DAYS);
        }

        if (count > plan.getMaxMessagesPerMonth()) {
            // Roll back the increment so repeated calls don't keep failing silently
            redisTemplate.opsForValue().decrement(key);
            throw new PlanLimitExceededException(
                    "You have reached your monthly message limit (" + plan.getMaxMessagesPerMonth() +
                    ") on the " + plan.getDisplayName() + " plan. Please upgrade to continue.");
        }
    }

    // ── Usage stats (for billing page) ───────────────────────────────────────

    public long getMessageCountThisMonth(UUID tenantId) {
        String val = redisTemplate.opsForValue().get(messageCountKey(tenantId));
        return val == null ? 0 : Long.parseLong(val);
    }

    public long getBotCount(UUID tenantId) {
        return chatbotRepository.countByTenantId(tenantId);
    }

    public long getKnowledgeSourceCount(UUID tenantId) {
        return knowledgeSourceRepository.countByTenantId(tenantId);
    }

    private String messageCountKey(UUID tenantId) {
        return "usage:" + tenantId + ":messages:" + YearMonth.now();
    }
}
