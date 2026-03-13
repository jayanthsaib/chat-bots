package com.infectbyte.botforge.domain.knowledge;

import com.infectbyte.botforge.common.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "knowledge_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeSource extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "chatbot_id", nullable = false)
    private UUID chatbotId;

    @Column(name = "source_type", nullable = false)
    private String sourceType;  // faq, document, website_url, text

    private String title;

    @Column(name = "original_content", columnDefinition = "TEXT")
    private String originalContent;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "website_url")
    private String websiteUrl;

    @Builder.Default
    private String status = "pending";  // pending, processing, indexed, failed

    @Column(name = "chunk_count")
    @Builder.Default
    private Integer chunkCount = 0;
}
