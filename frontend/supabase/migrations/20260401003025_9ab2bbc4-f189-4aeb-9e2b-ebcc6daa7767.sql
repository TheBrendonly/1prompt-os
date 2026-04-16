create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  client_ghl_account_id text not null,
  error_type text not null,
  error_message text not null,
  context jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_error_logs_lookup
  on error_logs (client_ghl_account_id, created_at desc);