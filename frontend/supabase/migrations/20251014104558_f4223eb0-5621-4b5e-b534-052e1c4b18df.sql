-- Add Retell Voice Agent Setup columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS retell_api_key TEXT,
ADD COLUMN IF NOT EXISTS retell_inbound_agent_id TEXT,
ADD COLUMN IF NOT EXISTS retell_outbound_agent_id TEXT,
ADD COLUMN IF NOT EXISTS retell_phone_1 TEXT,
ADD COLUMN IF NOT EXISTS retell_phone_1_country_code TEXT DEFAULT '+1',
ADD COLUMN IF NOT EXISTS retell_phone_2 TEXT,
ADD COLUMN IF NOT EXISTS retell_phone_2_country_code TEXT DEFAULT '+1',
ADD COLUMN IF NOT EXISTS retell_phone_3 TEXT,
ADD COLUMN IF NOT EXISTS retell_phone_3_country_code TEXT DEFAULT '+1';

-- Add comments for clarity
COMMENT ON COLUMN public.clients.retell_api_key IS 'Retell API key for voice agent integration';
COMMENT ON COLUMN public.clients.retell_inbound_agent_id IS 'Retell inbound agent ID';
COMMENT ON COLUMN public.clients.retell_outbound_agent_id IS 'Retell outbound agent ID';
COMMENT ON COLUMN public.clients.retell_phone_1 IS 'First Retell phone number';
COMMENT ON COLUMN public.clients.retell_phone_1_country_code IS 'Country code for first phone number';
COMMENT ON COLUMN public.clients.retell_phone_2 IS 'Second Retell phone number';
COMMENT ON COLUMN public.clients.retell_phone_2_country_code IS 'Country code for second phone number';
COMMENT ON COLUMN public.clients.retell_phone_3 IS 'Third Retell phone number';
COMMENT ON COLUMN public.clients.retell_phone_3_country_code IS 'Country code for third phone number';