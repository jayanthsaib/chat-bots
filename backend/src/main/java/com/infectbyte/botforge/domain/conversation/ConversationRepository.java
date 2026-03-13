package com.infectbyte.botforge.domain.conversation;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    Optional<Conversation> findBySessionIdAndTenantId(String sessionId, UUID tenantId);
    Optional<Conversation> findBySessionId(String sessionId);
    Page<Conversation> findAllByTenantId(UUID tenantId, Pageable pageable);
    Optional<Conversation> findByIdAndTenantId(UUID id, UUID tenantId);
}
