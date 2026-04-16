
-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  reactivation_notes TEXT,
  webhook_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, active, paused, completed
  total_leads INTEGER DEFAULT 0,
  processed_leads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table  
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_data JSONB NOT NULL, -- Flexible storage for any CSV columns
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  scheduled_for TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign_schedules table
CREATE TABLE public.campaign_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  days_of_week INTEGER[] NOT NULL, -- [1,2,3,4,5,6,7] for Mon-Sun
  start_time TIME NOT NULL, -- 09:00:00
  end_time TIME NOT NULL, -- 17:00:00
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  batch_size INTEGER NOT NULL DEFAULT 10,
  batch_interval_minutes INTEGER NOT NULL DEFAULT 15, -- Minutes between batches
  lead_delay_seconds INTEGER NOT NULL DEFAULT 5, -- Seconds between individual leads
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create execution_logs table
CREATE TABLE public.execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL, -- success, failed, retry
  webhook_response TEXT,
  error_details TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Enable Row Level Security on all tables
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (since this is a lead reactivation tool)
-- Users can view all campaigns
CREATE POLICY "Allow public read access to campaigns" 
  ON public.campaigns FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access to campaigns" 
  ON public.campaigns FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access to campaigns" 
  ON public.campaigns FOR UPDATE 
  USING (true);

-- Users can view all leads
CREATE POLICY "Allow public read access to leads" 
  ON public.leads FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access to leads" 
  ON public.leads FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access to leads" 
  ON public.leads FOR UPDATE 
  USING (true);

-- Users can view all campaign schedules
CREATE POLICY "Allow public read access to campaign_schedules" 
  ON public.campaign_schedules FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access to campaign_schedules" 
  ON public.campaign_schedules FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access to campaign_schedules" 
  ON public.campaign_schedules FOR UPDATE 
  USING (true);

-- Users can view all execution logs
CREATE POLICY "Allow public read access to execution_logs" 
  ON public.execution_logs FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access to execution_logs" 
  ON public.execution_logs FOR INSERT 
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_scheduled_for ON public.leads(scheduled_for);
CREATE INDEX idx_execution_logs_campaign_id ON public.execution_logs(campaign_id);
CREATE INDEX idx_execution_logs_lead_id ON public.execution_logs(lead_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.execution_logs;
