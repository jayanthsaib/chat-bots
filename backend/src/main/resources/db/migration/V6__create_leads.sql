CREATE TABLE leads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    chatbot_id      UUID NOT NULL REFERENCES chatbots(id),
    conversation_id UUID REFERENCES conversations(id),
    full_name       VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    source          VARCHAR(100),
    intent          TEXT,
    status          VARCHAR(50) DEFAULT 'new',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
