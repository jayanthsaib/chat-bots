package com.infectbyte.botforge.domain.knowledge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, UUID> {

    @Query(value = """
            SELECT * FROM knowledge_chunks
            WHERE chatbot_id = :chatbotId AND tenant_id = :tenantId
            ORDER BY embedding <=> CAST(:queryVector AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<KnowledgeChunk> findSimilarChunks(
            @Param("chatbotId") UUID chatbotId,
            @Param("tenantId") UUID tenantId,
            @Param("queryVector") String queryVector,
            @Param("limit") int limit
    );

    @Query(value = """
            SELECT * FROM knowledge_chunks
            WHERE chatbot_id = :chatbotId AND tenant_id = :tenantId
              AND (1 - (embedding <=> CAST(:queryVector AS vector))) >= :threshold
            ORDER BY embedding <=> CAST(:queryVector AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<KnowledgeChunk> findSimilarChunksAboveThreshold(
            @Param("chatbotId") UUID chatbotId,
            @Param("tenantId") UUID tenantId,
            @Param("queryVector") String queryVector,
            @Param("limit") int limit,
            @Param("threshold") double threshold
    );

    @Query(value = """
            SELECT * FROM knowledge_chunks
            WHERE chatbot_id = :chatbotId AND tenant_id = :tenantId
              AND chunk_text ILIKE :keyword
            ORDER BY chunk_index ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<KnowledgeChunk> findByKeyword(
            @Param("chatbotId") UUID chatbotId,
            @Param("tenantId") UUID tenantId,
            @Param("keyword") String keyword,
            @Param("limit") int limit
    );

    void deleteBySourceId(UUID sourceId);

    long countByChatbotIdAndTenantId(UUID chatbotId, UUID tenantId);
}
