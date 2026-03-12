package com.infectbyte.botforge.domain.chatbot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatbotRepository extends JpaRepository<Chatbot, UUID> {
    List<Chatbot> findAllByTenantId(UUID tenantId);
    Optional<Chatbot> findByIdAndTenantId(UUID id, UUID tenantId);
    boolean existsByIdAndTenantId(UUID id, UUID tenantId);
}
