package com.infectbyte.botforge.domain.lead;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID> {
    Page<Lead> findAllByTenantId(UUID tenantId, Pageable pageable);
    Optional<Lead> findByIdAndTenantId(UUID id, UUID tenantId);
    Optional<Lead> findByConversationId(UUID conversationId);
    long countByTenantId(UUID tenantId);
}
