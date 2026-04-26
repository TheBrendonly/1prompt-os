-- 20260426100000_bfd_platform_rls_audit.sql
-- Phase 6b: Close the 19 Apr 2026 Supabase RLS exposure on bfd-platform.
-- Strategy:
--   Group A (backend-only, no frontend reads): RLS on, no policies. Service role bypasses.
--     active_trigger_runs, message_queue, openrouter_usage
--   Group B (frontend-touched, has client_id): agency-scoped policies via clients.id.
--     agent_settings, leads, ai_generation_jobs, followup_timers, error_logs
--   Group C (frontend-touched, no client_id): agency-scoped via ghl_location_id JOIN.
--     credentials (gohighlevel_location_id), dm_executions (ghl_account_id)
-- All policies authenticated-only; anon role keeps no access.
-- Idempotent: safe to re-run.

BEGIN;

-- ── Group A: backend-only ────────────────────────────────────────────────────
ALTER TABLE public.active_trigger_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openrouter_usage    ENABLE ROW LEVEL SECURITY;

-- ── Group B: agency-scoped via client_id ────────────────────────────────────

-- agent_settings (full CRUD from frontend)
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_select_agent_settings" ON public.agent_settings;
CREATE POLICY "agency_select_agent_settings" ON public.agent_settings
  FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ));
DROP POLICY IF EXISTS "agency_modify_agent_settings" ON public.agent_settings;
CREATE POLICY "agency_modify_agent_settings" ON public.agent_settings
  FOR ALL TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ))
  WITH CHECK (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ));

-- leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_all_leads" ON public.leads;
CREATE POLICY "agency_all_leads" ON public.leads
  FOR ALL TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ))
  WITH CHECK (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ));

-- ai_generation_jobs
ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_all_ai_generation_jobs" ON public.ai_generation_jobs;
CREATE POLICY "agency_all_ai_generation_jobs" ON public.ai_generation_jobs
  FOR ALL TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ))
  WITH CHECK (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ));

-- followup_timers
ALTER TABLE public.followup_timers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_all_followup_timers" ON public.followup_timers;
CREATE POLICY "agency_all_followup_timers" ON public.followup_timers
  FOR ALL TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ))
  WITH CHECK (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ));

-- error_logs (has both client_id and client_ghl_account_id; we use client_id)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_select_error_logs" ON public.error_logs;
CREATE POLICY "agency_select_error_logs" ON public.error_logs
  FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ));
-- Inserts come from edge functions (service role) — no authenticated INSERT policy needed.

-- ── Group C: agency-scoped via ghl_location_id JOIN ─────────────────────────

-- credentials (joins via gohighlevel_location_id → clients.ghl_location_id)
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_all_credentials" ON public.credentials;
CREATE POLICY "agency_all_credentials" ON public.credentials
  FOR ALL TO authenticated
  USING (gohighlevel_location_id IN (
    SELECT clients.ghl_location_id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ))
  WITH CHECK (gohighlevel_location_id IN (
    SELECT clients.ghl_location_id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ));

-- dm_executions (joins via ghl_account_id → clients.ghl_location_id)
ALTER TABLE public.dm_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "agency_select_dm_executions" ON public.dm_executions;
CREATE POLICY "agency_select_dm_executions" ON public.dm_executions
  FOR SELECT TO authenticated
  USING (ghl_account_id IN (
    SELECT clients.ghl_location_id FROM clients
    WHERE clients.agency_id = (SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid())
  ));
-- Writes come from Trigger.dev / edge functions (service role) — no authenticated write policy needed.

COMMIT;
