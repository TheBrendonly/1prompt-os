-- Create a default main agency
INSERT INTO public.agencies (id, name, email) 
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Main Agency',
  'admin@mailagency.com'
) ON CONFLICT (id) DO NOTHING;

-- Update the handle_new_user function to automatically assign users to main agency
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, agency_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    '00000000-0000-0000-0000-000000000001'::uuid
  );
  RETURN NEW;
END;
$function$;