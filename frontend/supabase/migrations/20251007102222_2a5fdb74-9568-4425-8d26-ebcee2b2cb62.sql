-- Add openai_api_key column to clients table
ALTER TABLE public.clients 
ADD COLUMN openai_api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.clients.openai_api_key IS 'OpenAI API key for AI-powered features';