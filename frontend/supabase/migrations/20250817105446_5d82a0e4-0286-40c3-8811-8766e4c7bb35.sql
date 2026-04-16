-- Fix function search path mutable issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_campaign_with_data(campaign_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  campaign_exists BOOLEAN;
BEGIN
  -- Check if campaign exists and belongs to current user's agency clients
  SELECT EXISTS(
    SELECT 1 FROM public.campaigns 
    JOIN public.clients ON clients.id = campaigns.client_id
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE campaigns.id = campaign_id_param 
    AND profiles.id = auth.uid()
  ) INTO campaign_exists;
  
  IF NOT campaign_exists THEN
    RAISE EXCEPTION 'Campaign not found or access denied';
  END IF;
  
  -- Delete execution logs first
  DELETE FROM public.execution_logs 
  WHERE campaign_id = campaign_id_param;
  
  -- Delete leads
  DELETE FROM public.leads 
  WHERE campaign_id = campaign_id_param;
  
  -- Delete campaign schedules if they exist
  DELETE FROM public.campaign_schedules 
  WHERE campaign_id = campaign_id_param;
  
  -- Finally delete the campaign
  DELETE FROM public.campaigns 
  WHERE id = campaign_id_param;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;