-- Fix knowledge_chunks: add ON DELETE CASCADE for chatbot_id FK
ALTER TABLE knowledge_chunks DROP CONSTRAINT IF EXISTS knowledge_chunks_chatbot_id_fkey;
ALTER TABLE knowledge_chunks ADD CONSTRAINT knowledge_chunks_chatbot_id_fkey
    FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE;

-- Fix knowledge_chunks: add ON DELETE CASCADE for tenant_id FK
ALTER TABLE knowledge_chunks DROP CONSTRAINT IF EXISTS knowledge_chunks_tenant_id_fkey;
ALTER TABLE knowledge_chunks ADD CONSTRAINT knowledge_chunks_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
