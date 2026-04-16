create policy "Authenticated users can read error_logs"
  on error_logs for select
  to authenticated
  using (true);

create policy "Authenticated users can delete error_logs"
  on error_logs for delete
  to authenticated
  using (true);