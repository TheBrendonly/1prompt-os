-- ============================================================
-- bfd-platform Phase 3 smoke-test fixes
--
-- Each block below was added reactively while walking the
-- dashboard sidebar top-to-bottom. The preceding surgical patch
-- (20260422120000_bfd_platform_surgical_patch.sql) covered the
-- already-known gaps; this file captures whatever surfaces on
-- top of that.
--
-- Safe to re-run: all DDL uses IF NOT EXISTS / OR REPLACE.
-- ============================================================


-- ── Voice Setter page — Refresh Tool Messages button ────────────
-- retell-proxy edge function SELECTs retell_agent_id_4..10 from clients
-- (SLOT_TO_AGENT_COLUMN map, slots 4-10). Only `_4` existed; 5-10 were
-- missing, so the SELECT failed with 42703 and the edge function
-- returned a non-2xx, surfacing in UI as "Refresh failed".
alter table public.clients
  add column if not exists retell_agent_id_5  text,
  add column if not exists retell_agent_id_6  text,
  add column if not exists retell_agent_id_7  text,
  add column if not exists retell_agent_id_8  text,
  add column if not exists retell_agent_id_9  text,
  add column if not exists retell_agent_id_10 text;


-- ── Voice Setter page — Save Setter button (external DB) ────────
-- save-external-prompt edge function targets voice_prompts on the
-- client's own Supabase (bfd-setter-live: qildpilxjodxdifggmto),
-- which had only 'prompts' + 'text_prompts' — voice_prompts was
-- missing, so the function returned 500 and the UI showed an
-- "External sync warning" toast (Retell sync still proceeded).
--
-- The fix (CREATE TABLE voice_prompts) lives in the external
-- client schema extension, not here, because it belongs to the
-- per-client DB template, not bfd-platform:
--   supabase/client-schema-extension.sql


-- ── Voice Setter — Booking Function toggle ──────────────────────
-- useAgentSettings upserts file_processing_enabled +
-- human_transfer_enabled into agent_settings on every save. Both
-- columns were missing, so every toggle raised 42703 and the UI
-- showed "Failed to save agent settings" and reverted the toggle.
alter table public.agent_settings
  add column if not exists file_processing_enabled boolean default false,
  add column if not exists human_transfer_enabled  boolean default false;


-- ── Simulator page — New Simulation button ──────────────────────
-- Simulator.tsx inserts into simulations with a 'name' column
-- (defaultName used for the simulation run), but the surgical
-- patch's simulations table was created without one. Every click
-- failed with 42703.
alter table public.simulations
  add column if not exists name text;


-- ── Work Pages sidebar group — 5 missing tables ─────────────────
-- The "Work Pages" nav section (Knowledgebase, Demo Pages, Email,
-- Instagram DMs) all failed on page load because their backing
-- tables were never shipped with the trimmed bfd-platform install.
-- Schemas mirror the types.ts definitions so the TS client stays
-- happy without a re-generate.

-- Knowledgebase — used by the Knowledgebase work-page; stores
-- per-client docs that back the RAG/"knowledge base" feature.
create table if not exists public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null,
  content text,
  tags text[],
  category text,
  is_published boolean default true,
  webhook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.knowledge_base enable row level security;
drop policy if exists "Users can manage knowledge base for their clients" on public.knowledge_base;
create policy "Users can manage knowledge base for their clients"
  on public.knowledge_base for all to authenticated
  using (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())))
  with check (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())));
drop trigger if exists update_knowledge_base_updated_at on public.knowledge_base;
create trigger update_knowledge_base_updated_at before update on public.knowledge_base
  for each row execute function public.update_updated_at_column();

-- demo_pages — per-client microsites built in DemoPageEditor.
create table if not exists public.demo_pages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  title text not null default 'Untitled Demo Page',
  slug text,
  header_logo_url text,
  intro_title text,
  intro_subtitle text,
  sections jsonb,
  published_sections jsonb,
  is_published boolean default false,
  voice_section_title text,
  voice_section_subtitle text,
  voice_phone_number text,
  voice_phone_country_code text,
  voice_call_enabled boolean default false,
  phone_call_webhook_url text,
  text_ai_title text,
  text_ai_subtitle text,
  text_ai_webhook_url text,
  text_ai_enabled_platforms text[],
  form_ai_title text,
  form_ai_subtitle text,
  form_ai_webhook_url text,
  creatives_section_title text,
  creatives_section_subtitle text,
  creatives_page_name text,
  creatives_page_logo text,
  creatives jsonb default '[]'::jsonb,
  chatbot_section_title text,
  chatbot_section_subtitle text,
  chat_widget_code text,
  webhook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_demo_pages_slug on public.demo_pages(slug) where slug is not null;
alter table public.demo_pages enable row level security;
drop policy if exists "Users can manage demo pages for their clients" on public.demo_pages;
create policy "Users can manage demo pages for their clients"
  on public.demo_pages for all to authenticated
  using (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())))
  with check (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())));
drop policy if exists "Public can view published demo pages" on public.demo_pages;
create policy "Public can view published demo pages" on public.demo_pages for select to anon using (is_published = true);
drop trigger if exists update_demo_pages_updated_at on public.demo_pages;
create trigger update_demo_pages_updated_at before update on public.demo_pages
  for each row execute function public.update_updated_at_column();

-- demo_page_contacts — contacts captured through a demo page.
create table if not exists public.demo_page_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  phone_number text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.demo_page_contacts enable row level security;
drop policy if exists "Users can manage demo page contacts for their clients" on public.demo_page_contacts;
create policy "Users can manage demo page contacts for their clients"
  on public.demo_page_contacts for all to authenticated
  using (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())))
  with check (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())));
drop trigger if exists update_demo_page_contacts_updated_at on public.demo_page_contacts;
create trigger update_demo_page_contacts_updated_at before update on public.demo_page_contacts
  for each row execute function public.update_updated_at_column();

-- sms_messages — outbound + inbound SMS sent through demo pages.
create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  contact_id uuid not null references public.demo_page_contacts(id) on delete cascade,
  body text not null,
  direction text not null default 'outbound',
  from_number text,
  to_number text,
  status text not null default 'queued',
  twilio_sid text,
  created_at timestamptz not null default now()
);
create index if not exists idx_sms_messages_contact_created on public.sms_messages(contact_id, created_at desc);
alter table public.sms_messages enable row level security;
drop policy if exists "Users can manage sms messages for their clients" on public.sms_messages;
create policy "Users can manage sms messages for their clients"
  on public.sms_messages for all to authenticated
  using (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())))
  with check (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())));

-- campaigns — DB Reactivation ("Campaigns" sidebar / Dashboard.tsx
-- at /campaigns). Dashboard.tsx does .from('campaigns').select('*')
-- on page load; without the table the page shows "Failed to fetch
-- campaigns". Distinct from engagement_campaigns (that drives the
-- Engagement workflow executions, already present).
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  user_id uuid,
  campaign_name text not null,
  status text not null default 'draft',
  reactivation_notes text,
  webhook_url text,
  total_leads integer default 0,
  processed_leads integer default 0,
  batch_size integer default 10,
  batch_interval_minutes integer default 30,
  lead_delay_seconds integer default 5,
  start_time time,
  end_time time,
  timezone text,
  days_of_week integer[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_campaigns_client_created on public.campaigns(client_id, created_at desc);
alter table public.campaigns enable row level security;
drop policy if exists "Users can manage campaigns for their clients" on public.campaigns;
create policy "Users can manage campaigns for their clients"
  on public.campaigns for all to authenticated
  using (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())))
  with check (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())));
drop trigger if exists update_campaigns_updated_at on public.campaigns;
create trigger update_campaigns_updated_at before update on public.campaigns
  for each row execute function public.update_updated_at_column();


-- unipile_accounts — stores Unipile OAuth account IDs per client
-- for the Email and Instagram DMs work-pages. The pages load fine
-- once the table exists; actual messaging needs a Unipile OAuth
-- flow + UNIPILE_API_KEY + UNIPILE_DSN secrets on bfd-platform.
create table if not exists public.unipile_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  provider text not null default 'instagram',
  unipile_account_id text not null,
  display_name text,
  status text not null default 'connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_unipile_accounts_client_provider on public.unipile_accounts(client_id, provider, unipile_account_id);
alter table public.unipile_accounts enable row level security;
drop policy if exists "Users can manage unipile accounts for their clients" on public.unipile_accounts;
create policy "Users can manage unipile accounts for their clients"
  on public.unipile_accounts for all to authenticated
  using (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())))
  with check (client_id in (select c.id from clients c where c.agency_id in (select p.agency_id from profiles p where p.id = auth.uid())));
drop trigger if exists update_unipile_accounts_updated_at on public.unipile_accounts;
create trigger update_unipile_accounts_updated_at before update on public.unipile_accounts
  for each row execute function public.update_updated_at_column();

