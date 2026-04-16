-- Add what_to_do_acknowledged field to clients table
ALTER TABLE public.clients 
ADD COLUMN what_to_do_acknowledged boolean DEFAULT false;