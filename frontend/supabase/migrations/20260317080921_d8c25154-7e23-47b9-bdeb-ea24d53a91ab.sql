
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('agency', 'client');

-- 2. Create user_roles table (per system instructions - roles MUST be separate table)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'agency',
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Add client_id to profiles for client users
ALTER TABLE public.profiles ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- 4. Security definer function to check role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Security definer function to get user's client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- 6. Security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 7. RLS on user_roles - users can see their own, agencies can manage all
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Agencies can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'agency'))
WITH CHECK (public.has_role(auth.uid(), 'agency'));

-- 8. Assign 'agency' role to ALL existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'agency'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- 9. Update handle_new_user trigger to auto-assign 'agency' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, agency_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    gen_random_uuid()
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agency');
  RETURN NEW;
END;
$function$;
