ALTER TABLE public.engagement_executions
  ADD COLUMN IF NOT EXISTS enrollment_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_new_lead boolean DEFAULT false;