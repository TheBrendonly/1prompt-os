
create table if not exists public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  job_type text not null,
  status text default 'pending',
  input_payload jsonb,
  result jsonb,
  error_message text,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_ai_generation_jobs_client
  on public.ai_generation_jobs (client_id, created_at desc);

alter table public.ai_generation_jobs enable row level security;

create policy "Users can view their own AI generation jobs"
  on public.ai_generation_jobs
  for select
  to authenticated
  using (client_id in (
    select id from public.clients
    where agency_id in (
      select agency_id from public.profiles where id = auth.uid()
    )
  ));

create policy "Service role full access to ai_generation_jobs"
  on public.ai_generation_jobs
  for all
  to service_role
  using (true)
  with check (true);

alter table public.ai_generation_jobs replica identity full;

alter table public.clients add column if not exists llm_model text;
