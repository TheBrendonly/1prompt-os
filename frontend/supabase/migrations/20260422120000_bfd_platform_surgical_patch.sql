-- ============================================================
-- bfd-platform surgical patch
-- Adds 12 tables the dashboard + Trigger.dev reference that
-- weren't applied when the schema was installed.
--
-- Safe to re-run: all CREATE TABLE are IF NOT EXISTS; policies
-- use DROP IF EXISTS before CREATE.
--
-- Prereqs (already present on live):
--   clients, profiles, agencies, user_roles, agent_settings,
--   engagement_workflows, engagement_campaigns, leads,
--   ai_generation_jobs, dm_executions, message_queue,
--   active_trigger_runs, followup_timers, openrouter_usage
-- ============================================================


-- ── 0. updated_at trigger helper ──────────────────────────────
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 1. dashboard_widgets ──────────────────────────────────────
create table if not exists public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  analytics_type text not null default 'text',
  widget_type text not null default 'doughnut',
  title text not null,
  width text not null default 'half',
  config jsonb not null default '{}'::jsonb,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.dashboard_widgets enable row level security;
drop policy if exists "Users can manage dashboard widgets for their clients" on public.dashboard_widgets;
create policy "Users can manage dashboard widgets for their clients"
  on public.dashboard_widgets for all to authenticated
  using (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ))
  with check (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));


-- ── 2. prompt_configurations ──────────────────────────────────
create table if not exists public.prompt_configurations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  slot_id text not null,
  config_key text not null,
  selected_option text,
  custom_content text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (client_id, slot_id, config_key)
);
alter table public.prompt_configurations enable row level security;
drop policy if exists "Users can manage prompt configs for their clients" on public.prompt_configurations;
create policy "Users can manage prompt configs for their clients"
  on public.prompt_configurations for all to authenticated
  using (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ))
  with check (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));
drop trigger if exists update_prompt_configurations_updated_at on public.prompt_configurations;
create trigger update_prompt_configurations_updated_at
  before update on public.prompt_configurations
  for each row execute function public.update_updated_at_column();


-- ── 3. simulations + children ─────────────────────────────────
create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  agent_number integer not null default 1,
  status text not null default 'draft',
  business_info text,
  test_goal text,
  test_specifics text,
  num_conversations integer not null default 5,
  min_messages integer not null default 3,
  max_messages integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.simulations enable row level security;
drop policy if exists "Users can manage simulations for their clients" on public.simulations;
create policy "Users can manage simulations for their clients"
  on public.simulations for all to authenticated
  using (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ))
  with check (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));

create table if not exists public.simulation_icp_profiles (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  name text not null default 'ICP Profile',
  description text,
  persona_count integer not null default 3,
  age_min integer not null default 18,
  age_max integer not null default 65,
  gender text not null default 'any',
  location text,
  behaviors text[] not null default array['friendly','skeptical','inquisitive']::text[],
  lead_trigger text,
  lead_knowledge text,
  concerns text,
  scenario_items text[] not null default array[]::text[],
  test_booking boolean not null default false,
  test_cancellation boolean not null default false,
  test_reschedule boolean not null default false,
  booking_count integer not null default 0,
  cancel_reschedule_count integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.simulation_icp_profiles enable row level security;
drop policy if exists "Users can manage ICP profiles for their simulations" on public.simulation_icp_profiles;
create policy "Users can manage ICP profiles for their simulations"
  on public.simulation_icp_profiles for all to authenticated
  using (simulation_id in (
    select s.id from simulations s where s.client_id in (
      select c.id from clients c where c.agency_id in (
        select p.agency_id from profiles p where p.id = auth.uid()
      )
    )
  ))
  with check (simulation_id in (
    select s.id from simulations s where s.client_id in (
      select c.id from clients c where c.agency_id in (
        select p.agency_id from profiles p where p.id = auth.uid()
      )
    )
  ));

create table if not exists public.simulation_personas (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  icp_profile_id uuid references public.simulation_icp_profiles(id) on delete set null,
  name text not null,
  age integer,
  gender text,
  occupation text,
  problem text,
  hobbies text,
  goal text,
  avatar_seed text,
  assigned_message_count integer not null default 4,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.simulation_personas enable row level security;
drop policy if exists "Users can manage simulation personas" on public.simulation_personas;
create policy "Users can manage simulation personas"
  on public.simulation_personas for all to authenticated
  using (simulation_id in (
    select s.id from simulations s where s.client_id in (
      select c.id from clients c where c.agency_id in (
        select p.agency_id from profiles p where p.id = auth.uid()
      )
    )
  ))
  with check (simulation_id in (
    select s.id from simulations s where s.client_id in (
      select c.id from clients c where c.agency_id in (
        select p.agency_id from profiles p where p.id = auth.uid()
      )
    )
  ));

create table if not exists public.simulation_messages (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid not null references public.simulation_personas(id) on delete cascade,
  role text not null default 'user',
  content text,
  message_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.simulation_messages enable row level security;
drop policy if exists "Users can manage simulation messages" on public.simulation_messages;
create policy "Users can manage simulation messages"
  on public.simulation_messages for all to authenticated
  using (persona_id in (
    select sp.id from simulation_personas sp where sp.simulation_id in (
      select s.id from simulations s where s.client_id in (
        select c.id from clients c where c.agency_id in (
          select p.agency_id from profiles p where p.id = auth.uid()
        )
      )
    )
  ))
  with check (persona_id in (
    select sp.id from simulation_personas sp where sp.simulation_id in (
      select s.id from simulations s where s.client_id in (
        select c.id from clients c where c.agency_id in (
          select p.agency_id from profiles p where p.id = auth.uid()
        )
      )
    )
  ));


-- ── 4. workflows + executions + steps ─────────────────────────
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null default 'Untitled Workflow',
  description text,
  is_active boolean not null default false,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.workflows enable row level security;
drop policy if exists "Users can manage workflows for their clients" on public.workflows;
create policy "Users can manage workflows for their clients"
  on public.workflows for all to authenticated
  using (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ))
  with check (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));

create table if not exists public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  status text not null default 'running',
  trigger_type text not null,
  trigger_data jsonb default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);
alter table public.workflow_executions enable row level security;
drop policy if exists "Users can manage workflow executions for their clients" on public.workflow_executions;
create policy "Users can manage workflow executions for their clients"
  on public.workflow_executions for all to authenticated
  using (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ))
  with check (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));

create table if not exists public.workflow_execution_steps (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.workflow_executions(id) on delete cascade,
  node_id text not null,
  node_type text not null,
  status text not null default 'pending',
  input_data jsonb default '{}'::jsonb,
  output_data jsonb default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.workflow_execution_steps enable row level security;
drop policy if exists "Users can view execution steps via execution" on public.workflow_execution_steps;
create policy "Users can view execution steps via execution"
  on public.workflow_execution_steps for all to authenticated
  using (execution_id in (
    select we.id from workflow_executions we where we.client_id in (
      select c.id from clients c where c.agency_id in (
        select p.agency_id from profiles p where p.id = auth.uid()
      )
    )
  ))
  with check (execution_id in (
    select we.id from workflow_executions we where we.client_id in (
      select c.id from clients c where c.agency_id in (
        select p.agency_id from profiles p where p.id = auth.uid()
      )
    )
  ));


-- ── 5. engagement_executions ──────────────────────────────────
create table if not exists public.engagement_executions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  workflow_id uuid references public.engagement_workflows(id),
  ghl_contact_id text not null,
  ghl_account_id text not null,
  contact_name text,
  contact_phone text,
  status text not null default 'pending',
  current_node_index integer default 0,
  last_completed_node_index integer,
  stage_description text,
  stop_reason text,
  trigger_run_id text,
  last_sms_sent_at timestamptz,
  waiting_for_reply_since timestamptz,
  waiting_for_reply_until timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.engagement_executions enable row level security;
drop policy if exists "Users can view engagement executions for their agency clients" on public.engagement_executions;
create policy "Users can view engagement executions for their agency clients"
  on public.engagement_executions for select to authenticated
  using (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));
drop policy if exists "Users can insert engagement executions for their agency clients" on public.engagement_executions;
create policy "Users can insert engagement executions for their agency clients"
  on public.engagement_executions for insert to authenticated
  with check (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));
drop policy if exists "Users can update engagement executions for their agency clients" on public.engagement_executions;
create policy "Users can update engagement executions for their agency clients"
  on public.engagement_executions for update to authenticated
  using (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));
drop trigger if exists update_engagement_executions_updated_at on public.engagement_executions;
create trigger update_engagement_executions_updated_at
  before update on public.engagement_executions
  for each row execute function public.update_updated_at_column();


-- ── 6. campaign_events ────────────────────────────────────────
create table if not exists public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  campaign_id uuid not null references public.engagement_campaigns(id) on delete cascade,
  execution_id uuid references public.engagement_executions(id) on delete set null,
  lead_id text not null,
  event_type text not null,
  channel text,
  node_index integer,
  node_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb
);
create index if not exists idx_campaign_events_campaign_occurred
  on public.campaign_events(campaign_id, occurred_at);
create index if not exists idx_campaign_events_client
  on public.campaign_events(client_id);
alter table public.campaign_events enable row level security;
drop policy if exists "Users can view campaign events for their clients" on public.campaign_events;
create policy "Users can view campaign events for their clients"
  on public.campaign_events for select to authenticated
  using (client_id in (
    select c.id from clients c where c.agency_id in (
      select p.agency_id from profiles p where p.id = auth.uid()
    )
  ));
drop policy if exists "Service role full access to campaign_events" on public.campaign_events;
create policy "Service role full access to campaign_events"
  on public.campaign_events for all to service_role
  using (true) with check (true);


-- ── 7. analytics_executions + analytics_results ───────────────
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
alter table public.analytics_executions enable row level security;

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
alter table public.analytics_results enable row level security;


-- ── 8. supporting indexes on existing tables ──────────────────
create index if not exists idx_message_queue_lookup
  on public.message_queue (ghl_contact_id, ghl_account_id, processed);
create index if not exists idx_dm_executions_lookup
  on public.dm_executions (ghl_account_id, started_at desc);
