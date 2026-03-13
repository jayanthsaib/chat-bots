package com.infectbyte.botforge.domain.conversation;

import com.infectbyte.botforge.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "chatbot_id", nullable = false)
    private UUID chatbotId;

    @Column(name = "session_id", nullable = false)
    private String sessionId;

    @Builder.Default
    private String channel = "web";

    @Column(name = "visitor_ip")
    private String visitorIp;

    @Column(name = "visitor_ua", columnDefinition = "TEXT")
    private String visitorUa;

    @Builder.Default
    private String status = "open";  // open, resolved, handed_off

    @Column(name = "assigned_to")
    private UUID assignedTo;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> metadata;

    @PrePersist
    protected void onConversationCreate() {
        startedAt = LocalDateTime.now();
        lastMessageAt = LocalDateTime.now();
    }
}
