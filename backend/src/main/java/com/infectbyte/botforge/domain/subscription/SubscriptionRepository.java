package com.infectbyte.botforge.domain.subscription;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findTopByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);
    Optional<Subscription> findByRazorpaySubscriptionId(String razorpaySubscriptionId);
    Optional<Subscription> findTopByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
