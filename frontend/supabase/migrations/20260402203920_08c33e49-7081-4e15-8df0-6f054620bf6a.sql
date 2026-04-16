
-- ── Table 4: analytics_executions ───────────────────────────────────────────
create table if not exists public.analytics_executions (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  trigger_run_id text,
  status text default 'pending',
  stage_description text,
  time_range text,
  start_date timestamptz,
  end_date timestamptz,
  error_message text,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create index if not exists idx_analytics_executions_lookup
on public.analytics_executions (client_id, started_at desc);

-- ── Table 5: analytics_results ──────────────────────────────────────────────
create table if not exists public.analytics_results (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.analytics_executions(id) on delete cascade,
  client_id text not null,
  widgets jsonb not null default '[]',
  default_metrics jsonb not null default '[]',
  summary jsonb not null default '{}',
  conversations_list jsonb not null default '[]',
  created_at timestamptz default now()
);

create index if not exists idx_analytics_results_lookup
on public.analytics_results (client_id, created_at desc);

create unique index if not exists idx_analytics_results_execution
on public.analytics_results (execution_id);

-- Enable RLS
alter table public.analytics_executions enable row level security;
alter table public.analytics_results enable row level security;

-- Add missing indexes on existing tables
create index if not exists idx_message_queue_lookup
on public.message_queue (ghl_contact_id, ghl_account_id, processed);

create index if not exists idx_dm_executions_lookup
on public.dm_executions (ghl_account_id, started_at desc);
