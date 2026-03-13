-- Vector similarity search index
CREATE INDEX idx_knowledge_chunks_embedding
    ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Tenant isolation indexes
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_chatbots_tenant_id ON chatbots(tenant_id);
CREATE INDEX idx_knowledge_sources_chatbot_id ON knowledge_sources(chatbot_id);
CREATE INDEX idx_knowledge_chunks_chatbot_tenant ON knowledge_chunks(chatbot_id, tenant_id);
CREATE INDEX idx_conversations_tenant_chatbot ON conversations(tenant_id, chatbot_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_leads_conversation_id ON leads(conversation_id);
CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_analytics_tenant_created ON analytics_events(tenant_id, created_at);
