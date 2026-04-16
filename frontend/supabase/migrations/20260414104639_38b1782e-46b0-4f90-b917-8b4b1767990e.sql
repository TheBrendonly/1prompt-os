
-- Add missing columns to call_history for comprehensive Retell call data
ALTER TABLE public.call_history
  ADD COLUMN IF NOT EXISTS campaign_id text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS token_usage integer,
  ADD COLUMN IF NOT EXISTS voicemail_detected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS human_pickup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS appointment_booked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS appointment_time timestamptz,
  ADD COLUMN IF NOT EXISTS custom_data jsonb;

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_call_history_campaign_id ON public.call_history (campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_history_contact_id ON public.call_history (contact_id);
CREATE INDEX IF NOT EXISTS idx_call_history_setter_id ON public.call_history (setter_id);
CREATE INDEX IF NOT EXISTS idx_call_history_created_at ON public.call_history (created_at DESC);
