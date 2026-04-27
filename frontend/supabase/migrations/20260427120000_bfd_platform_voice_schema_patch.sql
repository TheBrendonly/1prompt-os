-- 20260427120000_bfd_platform_voice_schema_patch.sql
-- Surgical patch to bfd-platform: closes voice-path schema gaps that the
-- prior surgical bootstrap skipped. Idempotent.
--
-- Adds:
--   1. clients.phone_call_webhook_url           (post-call analysis fan-out)
--   2. call_history.pre_call_context            (JSON snapshot Retell reads pre-call)
--   3. retell_agent_mapping (table + RLS + trigger) — fallback for Retell
--      client resolution when ghl_account_id isn't passed in dynamic vars.
--
-- RLS pattern mirrors 20260426100000_bfd_platform_rls_audit.sql (Group B,
-- agency-scoped via clients.agency_id JOIN profiles).

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS phone_call_webhook_url TEXT;

ALTER TABLE public.call_history
  ADD COLUMN IF NOT EXISTS pre_call_context JSONB DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.retell_agent_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  ghl_account_id TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT retell_agent_mapping_agent_id_unique UNIQUE (agent_id)
);

CREATE INDEX IF NOT EXISTS idx_retell_agent_mapping_agent_id
  ON public.retell_agent_mapping(agent_id);
CREATE INDEX IF NOT EXISTS idx_retell_agent_mapping_ghl_account_id
  ON public.retell_agent_mapping(ghl_account_id);

ALTER TABLE public.retell_agent_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view agent mappings for their agency"
  ON public.retell_agent_mapping;
CREATE POLICY "Users can view agent mappings for their agency"
  ON public.retell_agent_mapping FOR SELECT TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.agency_id = (SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage agent mappings for their agency"
  ON public.retell_agent_mapping;
CREATE POLICY "Users can manage agent mappings for their agency"
  ON public.retell_agent_mapping FOR ALL TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM public.clients c
      WHERE c.agency_id = (SELECT p.agency_id FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

DROP TRIGGER IF EXISTS update_retell_agent_mapping_updated_at
  ON public.retell_agent_mapping;
CREATE TRIGGER update_retell_agent_mapping_updated_at
  BEFORE UPDATE ON public.retell_agent_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- simulation_personas.error_message: captures exception text for failed
-- per-persona runs. Surfaces in the UI's persona-error tooltip so users
-- can diagnose without trawling edge function logs.
ALTER TABLE public.simulation_personas
  ADD COLUMN IF NOT EXISTS error_message TEXT;
