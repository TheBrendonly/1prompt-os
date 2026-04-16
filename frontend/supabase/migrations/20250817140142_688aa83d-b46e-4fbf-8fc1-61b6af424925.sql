-- Fix function search path security issue by setting search_path explicitly

-- Update existing functions to have secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_campaign_with_data(campaign_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.set_campaign_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set user_id to the authenticated user
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_agency_id uuid;
BEGIN
  -- Create a new agency for this user
  INSERT INTO public.agencies (name, email)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email) || '''s Agency',
    NEW.email
  )
  RETURNING id INTO new_agency_id;
  
  -- Create the user profile linked to the new agency
  INSERT INTO public.profiles (id, email, full_name, agency_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    new_agency_id
  );
  
  RETURN NEW;
END;
$$;