CREATE TABLE knowledge_sources (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    chatbot_id       UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
    source_type      VARCHAR(50) NOT NULL,
    title            VARCHAR(255),
    original_content TEXT,
    file_url         VARCHAR(500),
    website_url      VARCHAR(500),
    status           VARCHAR(50) DEFAULT 'pending',
    chunk_count      INT DEFAULT 0,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE knowledge_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    chatbot_id  UUID NOT NULL REFERENCES chatbots(id),
    source_id   UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    chunk_text  TEXT NOT NULL,
    chunk_index INT NOT NULL,
    token_count INT,
    embedding   VECTOR(1536),
    created_at  TIMESTAMP DEFAULT NOW()
);
