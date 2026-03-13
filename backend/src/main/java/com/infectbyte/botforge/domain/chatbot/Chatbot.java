package com.infectbyte.botforge.domain.chatbot;

import com.infectbyte.botforge.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "chatbots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chatbot extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String personality;

    @Builder.Default
    private String language = "en";

    @Builder.Default
    private String status = "draft";

    @Column(name = "widget_color")
    @Builder.Default
    private String widgetColor = "#4F46E5";

    @Column(name = "widget_position")
    @Builder.Default
    private String widgetPosition = "bottom-right";

    @Column(name = "welcome_message", columnDefinition = "TEXT")
    @Builder.Default
    private String welcomeMessage = "Hi! How can I help you today?";

    @Column(name = "fallback_message", columnDefinition = "TEXT")
    @Builder.Default
    private String fallbackMessage = "Let me connect you with a human agent.";

    @Column(name = "collect_lead")
    @Builder.Default
    private Boolean collectLead = true;

    @Column(name = "lead_trigger")
    @Builder.Default
    private String leadTrigger = "after_3_messages";

    @Column(name = "handoff_enabled")
    @Builder.Default
    private Boolean handoffEnabled = true;
}
