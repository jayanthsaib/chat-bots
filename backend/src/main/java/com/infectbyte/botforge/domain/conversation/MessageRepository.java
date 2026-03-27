package com.infectbyte.botforge.domain.conversation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findAllByConversationIdOrderByCreatedAtAsc(UUID conversationId);
    List<Message> findTop10ByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    @Query(value = """
            SELECT m.* FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE c.chatbot_id = :chatbotId
              AND c.tenant_id = :tenantId
              AND m.role = 'assistant'
              AND m.answered = false
            ORDER BY m.created_at DESC
            LIMIT 100
            """, nativeQuery = true)
    List<Message> findUnansweredByBotId(@Param("chatbotId") UUID chatbotId,
                                         @Param("tenantId") UUID tenantId);

    @Query(value = """
            SELECT m.* FROM messages m
            WHERE m.conversation_id = :conversationId
              AND m.role = 'user'
              AND m.created_at < :before
            ORDER BY m.created_at DESC
            LIMIT 1
            """, nativeQuery = true)
    Optional<Message> findLastUserMessageBefore(@Param("conversationId") UUID conversationId,
                                                 @Param("before") LocalDateTime before);
}
