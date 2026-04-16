-- Fix RLS policies and add missing functionality (handling existing policies)

-- 1. Add missing DELETE policy for campaign_schedules (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'campaign_schedules' 
    AND policyname = 'Users can delete schedules for their agency campaigns'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete schedules for their agency campaigns" 
    ON public.campaign_schedules 
    FOR DELETE 
    USING (EXISTS (
      SELECT 1 FROM campaigns 
      JOIN clients ON clients.id = campaigns.client_id
      JOIN profiles ON profiles.agency_id = clients.agency_id
      WHERE campaigns.id = campaign_schedules.campaign_id 
      AND profiles.id = auth.uid()
    ))';
  END IF;
END $$;

-- 2. Update campaign ownership trigger (replace existing function)
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

-- 3. Data repair: Create default clients for campaigns without client_id
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