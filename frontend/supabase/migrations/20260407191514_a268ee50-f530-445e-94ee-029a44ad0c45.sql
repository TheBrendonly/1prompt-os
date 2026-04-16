ALTER TABLE public.agent_settings
ADD COLUMN IF NOT EXISTS needs_external_sync boolean NOT NULL DEFAULT false;