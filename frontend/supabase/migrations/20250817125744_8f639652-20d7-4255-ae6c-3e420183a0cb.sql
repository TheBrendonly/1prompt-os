-- Fix RLS policies for campaigns and leads tables

-- Drop the existing INSERT policies that have no conditions
DROP POLICY IF EXISTS "Users can create campaigns for their agency clients" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create leads for own campaigns" ON public.leads;

-- Create proper INSERT policy for campaigns
CREATE POLICY "Users can create campaigns for their agency clients" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM clients
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = campaigns.client_id
  )
);

-- Create proper INSERT policy for leads  
CREATE POLICY "Users can create leads for own campaigns" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM campaigns
    JOIN clients ON clients.id = campaigns.client_id
    JOIN profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND campaigns.id = leads.campaign_id
  )
);

-- Also update campaigns to set user_id properly on insert
CREATE OR REPLACE FUNCTION public.set_campaign_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to the authenticated user
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id on campaign insert
DROP TRIGGER IF EXISTS set_campaign_user_id_trigger ON public.campaigns;
CREATE TRIGGER set_campaign_user_id_trigger
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_campaign_user_id();