package com.infectbyte.botforge.domain.plan;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(name = "price_inr", nullable = false)
    private int priceInr;

    @Column(name = "max_bots", nullable = false)
    private int maxBots;

    @Column(name = "max_messages_per_month", nullable = false)
    private int maxMessagesPerMonth;

    @Column(name = "max_knowledge_sources", nullable = false)
    private int maxKnowledgeSources;

    @Column(name = "razorpay_plan_id")
    private String razorpayPlanId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public boolean isUnlimited(int limit) {
        return limit == -1;
    }
}
