ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS elevenlabs_api_key TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_agent_id TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_kb_doc_id TEXT,
ADD COLUMN IF NOT EXISTS elevenlabs_agent_config JSONB DEFAULT '{}'::jsonb;