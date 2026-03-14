package com.infectbyte.botforge.domain.knowledge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeSourceRepository extends JpaRepository<KnowledgeSource, UUID> {
    List<KnowledgeSource> findAllByChatbotIdAndTenantId(UUID chatbotId, UUID tenantId);
    Optional<KnowledgeSource> findByIdAndTenantId(UUID id, UUID tenantId);
    void deleteByIdAndTenantId(UUID id, UUID tenantId);
    long countByChatbotId(UUID chatbotId);
    long countByTenantId(UUID tenantId);
}
