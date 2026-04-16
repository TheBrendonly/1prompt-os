
-- Remove error_logs from main database - it lives in the client's Supabase
DROP POLICY IF EXISTS "Users can manage error logs for their clients" ON public.error_logs;
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
DROP TABLE IF EXISTS public.error_logs;
