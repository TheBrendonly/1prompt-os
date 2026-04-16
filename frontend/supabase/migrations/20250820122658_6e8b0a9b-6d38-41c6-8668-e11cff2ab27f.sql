-- Remove the overly strict sensitive data validation that's blocking legitimate lead uploads
DROP FUNCTION IF EXISTS public.validate_lead_data() CASCADE;