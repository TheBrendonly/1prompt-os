-- ============================================================
-- BFD Platform — Save Setter final gap patch
--
-- Fills the remaining schema objects surfaced by DevTools when
-- TEXT SETTER → Save Setter is clicked. Targets bfd-platform
-- (bjgrgbgykvjrsuwwruoh). Apply via Supabase SQL editor.
-- ============================================================

-- ── prompt_chat_threads ───────────────────────────────────────
create table if not exists public.prompt_chat_threads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  title text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prompt_chat_threads_client
  on public.prompt_chat_threads (client_id);

alter table public.prompt_chat_threads enable row level security;

drop policy if exists "prompt_chat_threads_all_authenticated"
  on public.prompt_chat_threads;
create policy "prompt_chat_threads_all_authenticated"
  on public.prompt_chat_threads
  for all
  to authenticated
  using (true)
  with check (true);


-- ── prompt_chat_messages ──────────────────────────────────────
create table if not exists public.prompt_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.prompt_chat_threads(id) on delete cascade,
  role text not null default 'user',
  content text,
  message_type text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_chat_messages_thread
  on public.prompt_chat_messages (thread_id);

alter table public.prompt_chat_messages enable row level security;

drop policy if exists "prompt_chat_messages_all_authenticated"
  on public.prompt_chat_messages;
create policy "prompt_chat_messages_all_authenticated"
  on public.prompt_chat_messages
  for all
  to authenticated
  using (true)
  with check (true);


-- ── prompt_versions ───────────────────────────────────────────
create table if not exists public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  slot_id text not null,
  version_number integer not null,
  prompt_content text not null,
  original_prompt_content text,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists idx_prompt_versions_client_slot
  on public.prompt_versions (client_id, slot_id, version_number);

alter table public.prompt_versions enable row level security;

drop policy if exists "prompt_versions_all_authenticated"
  on public.prompt_versions;
create policy "prompt_versions_all_authenticated"
  on public.prompt_versions
  for all
  to authenticated
  using (true)
  with check (true);


-- ── setter_ai_reports ─────────────────────────────────────────
create table if not exists public.setter_ai_reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  slot_id text not null,
  report_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uidx_setter_ai_reports_client_slot
  on public.setter_ai_reports (client_id, slot_id);

alter table public.setter_ai_reports enable row level security;

drop policy if exists "setter_ai_reports_all_authenticated"
  on public.setter_ai_reports;
create policy "setter_ai_reports_all_authenticated"
  on public.setter_ai_reports
  for all
  to authenticated
  using (true)
  with check (true);


-- ── Missing columns ───────────────────────────────────────────
alter table public.agent_settings
  add column if not exists booking_function_enabled boolean default false;

alter table public.prompts
  add column if not exists description text;


-- ── updated_at triggers ───────────────────────────────────────
-- Reuses update_updated_at_column() created in the earlier
-- surgical patch migration (20260422120000).
drop trigger if exists trg_prompt_chat_threads_updated_at
  on public.prompt_chat_threads;
create trigger trg_prompt_chat_threads_updated_at
  before update on public.prompt_chat_threads
  for each row execute function public.update_updated_at_column();

drop trigger if exists trg_setter_ai_reports_updated_at
  on public.setter_ai_reports;
create trigger trg_setter_ai_reports_updated_at
  before update on public.setter_ai_reports
  for each row execute function public.update_updated_at_column();


-- ── Force PostgREST schema reload ─────────────────────────────
notify pgrst, 'reload schema';
