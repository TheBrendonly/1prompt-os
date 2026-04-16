ALTER TABLE public.simulation_personas 
  ADD COLUMN IF NOT EXISTS dummy_email text,
  ADD COLUMN IF NOT EXISTS dummy_phone text,
  ADD COLUMN IF NOT EXISTS booking_intent text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS preferred_booking_date text;