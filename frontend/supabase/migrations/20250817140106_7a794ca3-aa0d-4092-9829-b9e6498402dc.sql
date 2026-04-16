-- Fix RLS policies to be agency-based and add missing policies

-- 1. Update leads RLS policies to be agency-based
DROP POLICY IF EXISTS "Users can view leads from own campaigns" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads from own campaigns" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads from own campaigns" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads for own campaigns" ON public.leads;

CREATE POLICY "Users can view leads for their agency campaigns" 
ON public.leads 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  JOIN clients ON clients.id = campaigns.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE campaigns.id = leads.campaign_id 
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can create leads for their agency campaigns" 
ON public.leads 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM campaigns 
  JOIN clients ON clients.id = campaigns.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE campaigns.id = leads.campaign_id 
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can update leads for their agency campaigns" 
ON public.leads 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  JOIN clients ON clients.id = campaigns.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE campaigns.id = leads.campaign_id 
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can delete leads for their agency campaigns" 
ON public.leads 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  JOIN clients ON clients.id = campaigns.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE campaigns.id = leads.campaign_id 
  AND profiles.id = auth.uid()
));

-- 2. Update execution_logs RLS policies to be agency-based
DROP POLICY IF EXISTS "Users can view logs from own campaigns" ON public.execution_logs;
DROP POLICY IF EXISTS "Users can create logs for own campaigns" ON public.execution_logs;
DROP POLICY IF EXISTS "Users can delete logs from own campaigns" ON public.execution_logs;

CREATE POLICY "Users can view logs for their agency campaigns" 
ON public.execution_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  JOIN clients ON clients.id = campaigns.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE campaigns.id = execution_logs.campaign_id 
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can create logs for their agency campaigns" 
ON public.execution_logs 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM campaigns 
  JOIN clients ON clients.id = campaigns.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE campaigns.id = execution_logs.campaign_id 
  AND profiles.id = auth.uid()
));

CREATE POLICY "Users can delete logs for their agency campaigns" 
ON public.execution_logs 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  JOIN clients ON clients.id = campaigns.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE campaigns.id = execution_logs.campaign_id 
  AND profiles.id = auth.uid()
));

-- 3. Add missing DELETE policy for campaign_schedules
CREATE POLICY "Users can delete schedules for their agency campaigns" 
ON public.campaign_schedules 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  JOIN clients ON clients.id = campaigns.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE campaigns.id = campaign_schedules.campaign_id 
  AND profiles.id = auth.uid()
));

-- 4. Create trigger to enforce campaign ownership
CREATE OR REPLACE FUNCTION public.set_campaign_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to the authenticated user
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS set_campaign_user_id_trigger ON public.campaigns;
CREATE TRIGGER set_campaign_user_id_trigger
  BEFORE INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_campaign_user_id();

-- 5. Data repair: Create default clients for campaigns without client_id
DO $$
DECLARE
  campaign_record RECORD;
  user_agency_id uuid;
  default_client_id uuid;
BEGIN
  -- Loop through campaigns with null client_id
  FOR campaign_record IN 
    SELECT c.id, c.user_id, c.campaign_name, p.agency_id
    FROM campaigns c
    JOIN profiles p ON p.id = c.user_id
    WHERE c.client_id IS NULL
  LOOP
    -- Check if user's agency already has a default client
    SELECT id INTO default_client_id
    FROM clients 
    WHERE agency_id = campaign_record.agency_id 
    AND name = 'Default Client'
    LIMIT 1;
    
    -- If no default client exists, create one
    IF default_client_id IS NULL THEN
      INSERT INTO clients (name, agency_id, description)
      VALUES ('Default Client', campaign_record.agency_id, 'Auto-created for legacy campaigns')
      RETURNING id INTO default_client_id;
    END IF;
    
    -- Update campaign with the default client
    UPDATE campaigns 
    SET client_id = default_client_id
    WHERE id = campaign_record.id;
  END LOOP;
END $$;