CREATE TABLE api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    chatbot_id  UUID REFERENCES chatbots(id),
    key_hash    VARCHAR(255) UNIQUE NOT NULL,
    key_prefix  VARCHAR(20) NOT NULL,
    label       VARCHAR(100),
    last_used_at TIMESTAMP,
    expires_at  TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW()
);
