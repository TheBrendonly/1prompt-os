-- Set default value for ai_chat_webhook_url and update existing records
UPDATE clients 
SET ai_chat_webhook_url = 'https://n8n-1prompt.99players.com/webhook/bcd89376-0b70-44cd-9948-0378acc19ec8'
WHERE ai_chat_webhook_url IS NULL OR ai_chat_webhook_url = '';

-- Set default for future records
ALTER TABLE clients 
ALTER COLUMN ai_chat_webhook_url 
SET DEFAULT 'https://n8n-1prompt.99players.com/webhook/bcd89376-0b70-44cd-9948-0378acc19ec8';