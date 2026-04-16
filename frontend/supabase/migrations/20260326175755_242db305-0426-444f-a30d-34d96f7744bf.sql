ALTER TABLE public.simulation_icp_profiles 
  ADD COLUMN first_message_sender text NOT NULL DEFAULT 'inbound',
  ADD COLUMN first_message_detail text;