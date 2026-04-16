alter table public.analytics_executions enable row level security;
alter table public.analytics_results enable row level security;

drop policy if exists "Users can view analytics executions for their clients" on public.analytics_executions;
create policy "Users can view analytics executions for their clients"
on public.analytics_executions
for select
to authenticated
using (
  exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and c.id::text = analytics_executions.client_id
  )
);

drop policy if exists "Users can view analytics results for their clients" on public.analytics_results;
create policy "Users can view analytics results for their clients"
on public.analytics_results
for select
to authenticated
using (
  exists (
    select 1
    from public.clients c
    join public.profiles p on p.agency_id = c.agency_id
    where p.id = auth.uid()
      and c.id::text = analytics_results.client_id
  )
);