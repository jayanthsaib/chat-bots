-- Fix all FK constraints on chatbots(id) to use ON DELETE CASCADE

-- conversations
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_chatbot_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_chatbot_id_fkey
    FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE;

-- leads
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_chatbot_id_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_chatbot_id_fkey
    FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_conversation_id_fkey;
ALTER TABLE leads ADD CONSTRAINT leads_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- api_keys
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_chatbot_id_fkey;
ALTER TABLE api_keys ADD CONSTRAINT api_keys_chatbot_id_fkey
    FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE;

-- analytics_events
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_chatbot_id_fkey;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_chatbot_id_fkey
    FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE SET NULL;
