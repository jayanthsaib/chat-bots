CREATE TABLE plans (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(50)  NOT NULL UNIQUE,
    display_name            VARCHAR(100) NOT NULL,
    price_inr               INTEGER      NOT NULL DEFAULT 0,
    max_bots                INTEGER      NOT NULL DEFAULT 1,
    max_messages_per_month  INTEGER      NOT NULL DEFAULT 100,
    max_knowledge_sources   INTEGER      NOT NULL DEFAULT 3,
    razorpay_plan_id        VARCHAR(100),
    created_at              TIMESTAMP DEFAULT NOW()
);

INSERT INTO plans (name, display_name, price_inr, max_bots, max_messages_per_month, max_knowledge_sources) VALUES
('free',    'Free',    0,    1,  100,  3),
('starter', 'Starter', 999,  2,  1000, 10),
('growth',  'Growth',  2499, 5,  5000, 30),
('pro',     'Pro',     4999, -1, -1,   -1);

CREATE TABLE subscriptions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id                     UUID        NOT NULL REFERENCES plans(id),
    razorpay_subscription_id    VARCHAR(100) UNIQUE,
    status                      VARCHAR(50) NOT NULL DEFAULT 'created',
    current_period_start        TIMESTAMP,
    current_period_end          TIMESTAMP,
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status    ON subscriptions(status);
