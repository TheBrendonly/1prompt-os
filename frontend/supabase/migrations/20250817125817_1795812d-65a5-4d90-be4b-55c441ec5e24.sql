-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.set_campaign_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to the authenticated user
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;