CREATE TABLE analytics_events (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    chatbot_id  UUID REFERENCES chatbots(id),
    event_type  VARCHAR(100) NOT NULL,
    session_id  VARCHAR(255),
    properties  JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);
