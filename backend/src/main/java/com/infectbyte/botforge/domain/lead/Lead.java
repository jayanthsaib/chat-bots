package com.infectbyte.botforge.domain.lead;

import com.infectbyte.botforge.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "chatbot_id", nullable = false)
    private UUID chatbotId;

    @Column(name = "conversation_id")
    private UUID conversationId;

    @Column(name = "full_name")
    private String fullName;

    private String email;

    private String phone;

    private String source;

    @Column(columnDefinition = "TEXT")
    private String intent;

    @Builder.Default
    private String status = "new";  // new, contacted, converted, lost

    @Column(columnDefinition = "TEXT")
    private String notes;
}
