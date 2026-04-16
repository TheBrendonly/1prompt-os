-- Final Security Fix: Remove insecure view and ensure function is properly secured

-- 1. Drop the insecure view completely 
DROP VIEW IF EXISTS public.secure_leads_view;

-- 2. Verify the secure function has proper access controls
-- The function already has SECURITY DEFINER and proper RLS checks built in

-- 3. Grant only necessary permissions
REVOKE ALL ON FUNCTION public.get_secure_leads FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_secure_leads TO authenticated;