-- First, let's update the handle_new_user function to create a new agency for each user
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();