ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS payment_failed_date timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_retry_date timestamp with time zone DEFAULT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_failed_date timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_retry_date timestamp with time zone DEFAULT NULL;