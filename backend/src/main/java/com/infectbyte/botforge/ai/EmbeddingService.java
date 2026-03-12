package com.infectbyte.botforge.ai;

import com.infectbyte.botforge.domain.knowledge.KnowledgeChunk;
import com.infectbyte.botforge.domain.knowledge.KnowledgeChunkRepository;
import com.infectbyte.botforge.domain.knowledge.KnowledgeSource;
import com.infectbyte.botforge.domain.knowledge.KnowledgeSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final OpenAIClient openAIClient;
    private final KnowledgeChunkRepository chunkRepository;
    private final KnowledgeSourceRepository sourceRepository;
    private final TextChunker chunker;

    @Transactional
    public void embedAndStore(UUID sourceId, UUID chatbotId, UUID tenantId, String text) {
        List<String> chunks = chunker.chunk(text);
        log.info("Embedding {} chunks for source {}", chunks.size(), sourceId);

        // Delete existing chunks for this source (re-indexing)
        chunkRepository.deleteBySourceId(sourceId);

        for (int i = 0; i < chunks.size(); i++) {
            String chunkText = chunks.get(i);
            try {
                float[] embedding = openAIClient.embed(chunkText);

                KnowledgeChunk chunk = KnowledgeChunk.builder()
                        .tenantId(tenantId)
                        .chatbotId(chatbotId)
                        .sourceId(sourceId)
                        .chunkText(chunkText)
                        .chunkIndex(i)
                        .tokenCount(chunker.estimateTokens(chunkText))
                        .embedding(embedding)
                        .build();
                chunkRepository.save(chunk);
            } catch (Exception e) {
                log.error("Failed to embed chunk {} of source {}: {}", i, sourceId, e.getMessage());
                throw new RuntimeException("Embedding failed at chunk " + i, e);
            }
        }

        // Update source chunk count
        sourceRepository.findById(sourceId).ifPresent(source -> {
            source.setChunkCount(chunks.size());
            source.setStatus("indexed");
            sourceRepository.save(source);
        });
    }

    public float[] embedQuery(String query) {
        return openAIClient.embed(query);
    }
}
