-- Add OpenRouter API key column to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS openrouter_api_key text;

-- Optional: add a comment for clarity
COMMENT ON COLUMN public.clients.openrouter_api_key IS 'Per-client OpenRouter API key provided by users. Treat as sensitive.';