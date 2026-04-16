
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_agency_id uuid;
  new_client_id uuid;
BEGIN
  new_agency_id := gen_random_uuid();
  new_client_id := gen_random_uuid();

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, agency_id, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    new_agency_id,
    'free'
  );

  -- Create default agency role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agency');

  -- Create default sub-account
  INSERT INTO public.clients (id, name, agency_id, subscription_status)
  VALUES (
    new_client_id,
    'My First Account',
    new_agency_id,
    'free'
  );

  RETURN NEW;
END;
$function$;
