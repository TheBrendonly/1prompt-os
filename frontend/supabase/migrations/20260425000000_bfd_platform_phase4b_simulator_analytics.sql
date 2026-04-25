-- Phase 4b reactive fixes — surfaced while retesting AI-async buttons after the Lovable→OpenRouter
-- migration of the simulator edge functions and the run-analytics dispatch fix.
-- Idempotent so re-running on a fresh DB matches live bfd-platform state.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Simulator schema gaps — 9 columns surfaced when Generate Personas / Run
--    Simulation tried to insert/select against tables created in Phase 3 but
--    missing fields the Lovable-template code expected.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.simulation_personas
  ADD COLUMN IF NOT EXISTS dummy_email text,
  ADD COLUMN IF NOT EXISTS dummy_phone text,
  ADD COLUMN IF NOT EXISTS booking_intent text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS preferred_booking_date text;

ALTER TABLE public.simulation_messages
  ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'regular';

ALTER TABLE public.simulation_icp_profiles
  ADD COLUMN IF NOT EXISTS first_message_sender text DEFAULT 'inbound',
  ADD COLUMN IF NOT EXISTS first_message_detail text,
  ADD COLUMN IF NOT EXISTS form_fields text,
  ADD COLUMN IF NOT EXISTS outreach_message text;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Analytics aggregate tables (chat_analytics + voice_chat_analytics).
--    Created from migration 20260304141652_*.sql which had never been applied.
--    Frontend hook (useAnalyticsWebhook + ChatAnalytics.tsx) writes the cached
--    aggregate per (client_id, time_range) here so "Last updated" works.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.chat_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  time_range text NOT NULL,
  metrics jsonb DEFAULT '{}'::jsonb,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, time_range)
);
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.voice_chat_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  time_range text NOT NULL,
  metrics jsonb DEFAULT '{}'::jsonb,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, time_range)
);
ALTER TABLE public.voice_chat_analytics ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS policies. The Phase 3 surgical patch enabled RLS on analytics_executions
--    and analytics_results but never created any policies — meaning the
--    authenticated user could not SELECT their own rows. The frontend's
--    pollExecution loop saw `null` from .maybeSingle() and stayed in "STARTING…"
--    forever. Service role bypasses RLS so backend writes worked; only the user
--    session was blocked. (Note: client_id is `text` on both analytics tables,
--    not uuid, so the policy needs an explicit cast.)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analytics_executions'
      AND policyname = 'Users can manage analytics executions for their clients'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "Users can manage analytics executions for their clients"
        ON public.analytics_executions
        FOR ALL
        TO authenticated
        USING (client_id::uuid IN (
          SELECT c.id FROM clients c
          WHERE c.agency_id IN (
            SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
          )
        ))
        WITH CHECK (client_id::uuid IN (
          SELECT c.id FROM clients c
          WHERE c.agency_id IN (
            SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
          )
        ))
    $POL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'analytics_results'
      AND policyname = 'Users can manage analytics results for their clients'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "Users can manage analytics results for their clients"
        ON public.analytics_results
        FOR ALL
        TO authenticated
        USING (client_id::uuid IN (
          SELECT c.id FROM clients c
          WHERE c.agency_id IN (
            SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
          )
        ))
        WITH CHECK (client_id::uuid IN (
          SELECT c.id FROM clients c
          WHERE c.agency_id IN (
            SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
          )
        ))
    $POL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'chat_analytics'
      AND policyname = 'Users can manage chat analytics for their clients'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "Users can manage chat analytics for their clients"
        ON public.chat_analytics
        FOR ALL
        TO authenticated
        USING (client_id IN (
          SELECT c.id FROM clients c
          WHERE c.agency_id IN (
            SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
          )
        ))
    $POL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'voice_chat_analytics'
      AND policyname = 'Users can manage voice chat analytics for their clients'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "Users can manage voice chat analytics for their clients"
        ON public.voice_chat_analytics
        FOR ALL
        TO authenticated
        USING (client_id IN (
          SELECT c.id FROM clients c
          WHERE c.agency_id IN (
            SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
          )
        ))
    $POL$;
  END IF;
END $$;
