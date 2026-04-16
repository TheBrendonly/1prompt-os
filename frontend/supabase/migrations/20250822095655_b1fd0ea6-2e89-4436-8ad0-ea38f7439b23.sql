-- Create function to delete client with all related data
CREATE OR REPLACE FUNCTION public.delete_client_with_data(client_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  client_exists BOOLEAN;
  user_id_val UUID;
BEGIN
  -- Get current user ID safely
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check if client exists and belongs to current user's agency
  SELECT EXISTS(
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE clients.id = client_id_param 
    AND profiles.id = user_id_val
  ) INTO client_exists;
  
  IF NOT client_exists THEN
    RAISE EXCEPTION 'Client not found or access denied';
  END IF;
  
  -- Delete execution logs for campaigns belonging to this client
  DELETE FROM public.execution_logs 
  WHERE campaign_id IN (
    SELECT id FROM public.campaigns 
    WHERE client_id = client_id_param
  );
  
  -- Delete leads for campaigns belonging to this client
  DELETE FROM public.leads 
  WHERE campaign_id IN (
    SELECT id FROM public.campaigns 
    WHERE client_id = client_id_param
  );
  
  -- Delete campaign schedules for campaigns belonging to this client
  DELETE FROM public.campaign_schedules 
  WHERE campaign_id IN (
    SELECT id FROM public.campaigns 
    WHERE client_id = client_id_param
  );
  
  -- Delete campaigns for this client
  DELETE FROM public.campaigns 
  WHERE client_id = client_id_param;
  
  -- Delete knowledge base entries for this client
  DELETE FROM public.knowledge_base 
  WHERE client_id = client_id_param;
  
  -- Delete prompts for this client
  DELETE FROM public.prompts 
  WHERE client_id = client_id_param;
  
  -- Finally delete the client
  DELETE FROM public.clients 
  WHERE id = client_id_param;
  
  RETURN TRUE;
END;
$function$;