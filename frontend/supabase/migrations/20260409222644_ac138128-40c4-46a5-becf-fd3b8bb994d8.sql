
-- Engagement workflows table
CREATE TABLE IF NOT EXISTS public.engagement_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Engagement Workflow',
  nodes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.engagement_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view engagement workflows for their agency clients"
  ON public.engagement_workflows FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Users can insert engagement workflows for their agency clients"
  ON public.engagement_workflows FOR INSERT TO authenticated
  WITH CHECK (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Users can update engagement workflows for their agency clients"
  ON public.engagement_workflows FOR UPDATE TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Users can delete engagement workflows for their agency clients"
  ON public.engagement_workflows FOR DELETE TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

-- Engagement executions table
CREATE TABLE IF NOT EXISTS public.engagement_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.engagement_workflows(id),
  ghl_contact_id TEXT NOT NULL,
  ghl_account_id TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  current_node_index INTEGER DEFAULT 0,
  stage_description TEXT,
  stop_reason TEXT,
  trigger_run_id TEXT,
  last_sms_sent_at TIMESTAMPTZ,
  waiting_for_reply_since TIMESTAMPTZ,
  waiting_for_reply_until TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.engagement_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view engagement executions for their agency clients"
  ON public.engagement_executions FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Users can insert engagement executions for their agency clients"
  ON public.engagement_executions FOR INSERT TO authenticated
  WITH CHECK (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Users can update engagement executions for their agency clients"
  ON public.engagement_executions FOR UPDATE TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

-- Updated_at trigger for both tables
CREATE TRIGGER update_engagement_workflows_updated_at
  BEFORE UPDATE ON public.engagement_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engagement_executions_updated_at
  BEFORE UPDATE ON public.engagement_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
