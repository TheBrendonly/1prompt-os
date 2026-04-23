-- ============================================================
-- BFD Platform — column fills round 2
--
-- Closes the remaining column gaps that DevTools surfaced after
-- the first Save Setter round. Every write that failed with
-- PGRST204 / 42703 maps back to one of these columns.
-- ============================================================

-- ── prompts ───────────────────────────────────────────────────
alter table public.prompts
  add column if not exists slot_id  text,
  add column if not exists persona  text;


-- ── agent_settings ────────────────────────────────────────────
alter table public.agent_settings
  add column if not exists name          text,
  add column if not exists agent_name    text,
  add column if not exists system_prompt text,
  add column if not exists model         text;


-- ── ai_generation_jobs ────────────────────────────────────────
alter table public.ai_generation_jobs
  add column if not exists completed_at  timestamptz,
  add column if not exists input_payload jsonb,
  add column if not exists raw_exchanges jsonb;


-- ── Force PostgREST schema reload ─────────────────────────────
notify pgrst, 'reload schema';
