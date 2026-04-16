-- Add form_fields and outreach_message columns to simulation_icp_profiles
ALTER TABLE public.simulation_icp_profiles
  ADD COLUMN IF NOT EXISTS form_fields text DEFAULT '',
  ADD COLUMN IF NOT EXISTS outreach_message text DEFAULT '';

-- Add message_type column to simulation_messages to distinguish form/outreach/regular
ALTER TABLE public.simulation_messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'regular';
