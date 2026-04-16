CREATE TABLE public.engagement_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES public.engagement_workflows(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.engagement_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaigns for their clients"
  ON public.engagement_campaigns FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Users can insert campaigns for their clients"
  ON public.engagement_campaigns FOR INSERT TO authenticated
  WITH CHECK (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Users can update campaigns for their clients"
  ON public.engagement_campaigns FOR UPDATE TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Users can delete campaigns for their clients"
  ON public.engagement_campaigns FOR DELETE TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Service role full access to engagement_campaigns"
  ON public.engagement_campaigns FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TABLE public.campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.engagement_campaigns(id) ON DELETE CASCADE,
  execution_id uuid REFERENCES public.engagement_executions(id) ON DELETE SET NULL,
  lead_id text NOT NULL,
  event_type text NOT NULL,
  channel text,
  node_index integer,
  node_id text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb
);

CREATE INDEX idx_campaign_events_campaign_occurred ON public.campaign_events(campaign_id, occurred_at);
CREATE INDEX idx_campaign_events_client ON public.campaign_events(client_id);

ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaign events for their clients"
  ON public.campaign_events FOR SELECT TO authenticated
  USING (client_id IN (
    SELECT c.id FROM public.clients c
    JOIN public.profiles p ON p.agency_id = c.agency_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "Service role full access to campaign_events"
  ON public.campaign_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

ALTER TABLE public.dashboard_widgets ADD COLUMN campaign_id uuid REFERENCES public.engagement_campaigns(id) ON DELETE CASCADE;
ALTER TABLE public.custom_metrics ADD COLUMN campaign_id uuid REFERENCES public.engagement_campaigns(id) ON DELETE CASCADE;

CREATE TRIGGER update_engagement_campaigns_updated_at
  BEFORE UPDATE ON public.engagement_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();