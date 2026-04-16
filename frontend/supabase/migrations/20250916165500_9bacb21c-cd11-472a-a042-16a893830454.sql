-- Add Supabase configuration fields to clients table
ALTER TABLE public.clients 
ADD COLUMN supabase_service_key TEXT,
ADD COLUMN supabase_table_name TEXT,
ADD COLUMN supabase_url TEXT;