CREATE TABLE chatbots (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    personality      TEXT,
    language         VARCHAR(10) DEFAULT 'en',
    status           VARCHAR(50) DEFAULT 'draft',
    widget_color     VARCHAR(10) DEFAULT '#4F46E5',
    widget_position  VARCHAR(20) DEFAULT 'bottom-right',
    welcome_message  TEXT DEFAULT 'Hi! How can I help you today?',
    fallback_message TEXT DEFAULT 'Let me connect you with a human agent.',
    collect_lead     BOOLEAN DEFAULT true,
    lead_trigger     VARCHAR(50) DEFAULT 'after_3_messages',
    handoff_enabled  BOOLEAN DEFAULT true,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);
