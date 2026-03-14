CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    chatbot_id      UUID NOT NULL REFERENCES chatbots(id),
    session_id      VARCHAR(255) NOT NULL,
    channel         VARCHAR(50) DEFAULT 'web',
    visitor_ip      VARCHAR(50),
    visitor_ua      TEXT,
    status          VARCHAR(50) DEFAULT 'open',
    assigned_to     UUID REFERENCES users(id),
    started_at      TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP DEFAULT NOW(),
    resolved_at     TIMESTAMP,
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL,
    content         TEXT NOT NULL,
    tokens_used     INT DEFAULT 0,
    model_used      VARCHAR(100),
    latency_ms      INT,
    sources         JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);
