-- Add DELETE policies for all tables
CREATE POLICY "Users can delete own campaigns" 
ON public.campaigns 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete leads from own campaigns" 
ON public.leads 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  WHERE campaigns.id = leads.campaign_id 
  AND campaigns.user_id = auth.uid()
));

CREATE POLICY "Users can delete logs from own campaigns" 
ON public.execution_logs 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM campaigns 
  WHERE campaigns.id = execution_logs.campaign_id 
  AND campaigns.user_id = auth.uid()
));

-- Create function to delete campaign and all associated data
CREATE OR REPLACE FUNCTION public.delete_campaign_with_data(campaign_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  campaign_exists BOOLEAN;
BEGIN
  -- Check if campaign exists and belongs to current user
  SELECT EXISTS(
    SELECT 1 FROM public.campaigns 
    WHERE id = campaign_id_param AND user_id = auth.uid()
  ) INTO campaign_exists;
  
  IF NOT campaign_exists THEN
    RAISE EXCEPTION 'Campaign not found or access denied';
  END IF;
  
  -- Delete execution logs first
  DELETE FROM public.execution_logs 
  WHERE campaign_id = campaign_id_param;
  
  -- Delete leads
  DELETE FROM public.leads 
  WHERE campaign_id = campaign_id_param;
  
  -- Delete campaign schedules if they exist
  DELETE FROM public.campaign_schedules 
  WHERE campaign_id = campaign_id_param;
  
  -- Finally delete the campaign
  DELETE FROM public.campaigns 
  WHERE id = campaign_id_param AND user_id = auth.uid();
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;