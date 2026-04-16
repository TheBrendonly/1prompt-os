-- Update all existing profiles to be linked to the main agency
UPDATE public.profiles 
SET agency_id = '00000000-0000-0000-0000-000000000001'::uuid 
WHERE agency_id IS NULL;