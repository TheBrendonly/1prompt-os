select
  cron.schedule(
    'refresh-usage-cache-every-minute',
    '* * * * *',
    $$
    select
      net.http_post(
          url:='https://qfbhcixkxzivpmxlciot.supabase.co/functions/v1/refresh-usage-cache',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmYmhjaXhreHppdnBteGxjaW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzkyNzUsImV4cCI6MjA4ODExNTI3NX0.IzBGKmBGerpJk6kEiEwVFXarPbTVkAolT-Nsd934lck"}'::jsonb,
          body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $$
  );