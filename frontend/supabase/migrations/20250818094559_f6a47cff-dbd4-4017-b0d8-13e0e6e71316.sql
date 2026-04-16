-- Update security-definer functions to use immutable search paths
-- This prevents potential privilege escalation attacks

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update the delete_campaign_with_data function with better security
CREATE OR REPLACE FUNCTION public.delete_campaign_with_data(campaign_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  campaign_exists BOOLEAN;
  user_id_val UUID;
BEGIN
  -- Get current user ID safely
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if campaign exists and belongs to current user's agency clients
  SELECT EXISTS(
    SELECT 1 FROM public.campaigns 
    JOIN public.clients ON clients.id = campaigns.client_id
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE campaigns.id = campaign_id_param 
    AND profiles.id = user_id_val
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

-- Update the handle_new_user function with better security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_agency_id uuid;
BEGIN
  -- Validate input data
  IF NEW.id IS NULL OR NEW.email IS NULL THEN
    RAISE EXCEPTION 'Invalid user data';
  END IF;
  
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
$function$;

-- Create a secure function to get current user role (if needed)
CREATE OR REPLACE FUNCTION public.get_current_user_agency_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT agency_id FROM profiles WHERE id = auth.uid();
$$;

-- Add webhook URL validation function
CREATE OR REPLACE FUNCTION public.validate_webhook_url(url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Basic URL format validation
  IF url IS NULL OR url = '' THEN
    RETURN false;
  END IF;
  
  -- Must start with https:// for security
  IF NOT url ~ '^https://' THEN
    RETURN false;
  END IF;
  
  -- Block localhost and private IPs (basic check)
  IF url ~ '(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;