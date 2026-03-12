package com.infectbyte.botforge.domain.apikey;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {
    Optional<ApiKey> findByKeyHash(String keyHash);
    List<ApiKey> findAllByChatbotId(UUID chatbotId);
    List<ApiKey> findAllByTenantId(UUID tenantId);
}
