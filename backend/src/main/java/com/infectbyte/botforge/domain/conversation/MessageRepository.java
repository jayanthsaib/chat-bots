package com.infectbyte.botforge.domain.conversation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findAllByConversationIdOrderByCreatedAtAsc(UUID conversationId);
    List<Message> findTop10ByConversationIdOrderByCreatedAtDesc(UUID conversationId);
}
