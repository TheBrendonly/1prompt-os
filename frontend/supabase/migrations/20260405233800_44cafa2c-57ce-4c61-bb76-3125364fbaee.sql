alter table error_logs
  add column if not exists lead_id text,
  add column if not exists execution_id uuid,
  add column if not exists severity text not null default 'error';

create index if not exists error_logs_lead_id_idx on error_logs(lead_id);
create index if not exists error_logs_client_created_idx on error_logs(client_ghl_account_id, created_at desc);

alter table dm_executions
  add column if not exists has_error boolean not null default false;