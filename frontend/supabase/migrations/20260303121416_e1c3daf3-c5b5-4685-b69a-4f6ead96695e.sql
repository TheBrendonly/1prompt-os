
-- ============================
-- 1. PROFILES TABLE
-- ============================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  logo_url TEXT,
  agency_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, agency_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    gen_random_uuid()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================
-- 2. CLIENTS TABLE
-- ============================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  presentation_only_mode BOOLEAN DEFAULT false,
  
  -- Supabase config
  supabase_url TEXT,
  supabase_service_key TEXT,
  supabase_table_name TEXT,
  
  -- API keys
  ghl_api_key TEXT,
  ghl_assignee_id TEXT,
  ghl_calendar_id TEXT,
  ghl_location_id TEXT,
  openai_api_key TEXT,
  openrouter_api_key TEXT,
  retell_api_key TEXT,
  retell_inbound_agent_id TEXT,
  retell_outbound_agent_id TEXT,
  retell_outbound_followup_agent_id TEXT,
  retell_agent_id_4 TEXT,
  retell_phone_1 TEXT,
  retell_phone_1_country_code TEXT DEFAULT '+1',
  retell_phone_2 TEXT,
  retell_phone_2_country_code TEXT DEFAULT '+1',
  retell_phone_3 TEXT,
  retell_phone_3_country_code TEXT DEFAULT '+1',
  
  -- Webhook URLs
  api_webhook_url TEXT,
  campaign_webhook_url TEXT,
  knowledge_base_add_webhook_url TEXT,
  knowledge_base_delete_webhook_url TEXT,
  prompt_webhook_url TEXT,
  analytics_webhook_url TEXT,
  ai_chat_webhook_url TEXT,
  chat_analytics_webhook_url TEXT,
  text_engine_webhook TEXT,
  text_engine_followup_webhook TEXT,
  outbound_caller_webhook_1_url TEXT,
  outbound_caller_webhook_2_url TEXT,
  outbound_caller_webhook_3_url TEXT,
  transfer_to_human_webhook_url TEXT,
  save_reply_webhook_url TEXT,
  user_details_webhook_url TEXT,
  database_reactivation_inbound_webhook_url TEXT,
  lead_score_webhook_url TEXT,
  update_pipeline_webhook_url TEXT,
  phone_call_webhook_url TEXT,
  
  -- System settings
  system_prompt TEXT,
  setup_guide_completed_steps JSONB DEFAULT '[]'::jsonb,
  what_to_do_acknowledged BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Clients are accessible by users in the same agency
CREATE POLICY "Users can view clients in their agency" ON public.clients FOR SELECT USING (
  agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can insert clients in their agency" ON public.clients FOR INSERT WITH CHECK (
  agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update clients in their agency" ON public.clients FOR UPDATE USING (
  agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can delete clients in their agency" ON public.clients FOR DELETE USING (
  agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())
);

-- ============================
-- 3. CAMPAIGNS TABLE
-- ============================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  campaign_name TEXT NOT NULL,
  reactivation_notes TEXT,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_leads INTEGER DEFAULT 0,
  processed_leads INTEGER DEFAULT 0,
  batch_size INTEGER,
  batch_interval_minutes INTEGER,
  lead_delay_seconds INTEGER DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  days_of_week INTEGER[] DEFAULT '{}',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage campaigns for their clients" ON public.campaigns FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 4. LEADS TABLE
-- ============================
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads for their campaigns" ON public.leads FOR ALL USING (
  campaign_id IN (SELECT id FROM public.campaigns WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())))
);

CREATE INDEX idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_scheduled_for ON public.leads(scheduled_for);

-- ============================
-- 5. PROMPTS TABLE
-- ============================
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT,
  prompt_type TEXT DEFAULT 'text',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage prompts for their clients" ON public.prompts FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 6. KNOWLEDGE BASE TABLE
-- ============================
CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[],
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage knowledge base for their clients" ON public.knowledge_base FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 7. DEMO PAGES TABLE
-- ============================
CREATE TABLE public.demo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Demo Page',
  slug TEXT UNIQUE,
  is_published BOOLEAN DEFAULT false,
  sections JSONB,
  published_sections JSONB,
  
  -- Header
  header_logo_url TEXT,
  intro_title TEXT,
  intro_subtitle TEXT,
  
  -- Voice section
  voice_section_title TEXT,
  voice_section_subtitle TEXT,
  voice_phone_number TEXT,
  voice_phone_country_code TEXT DEFAULT '+1',
  voice_call_enabled BOOLEAN DEFAULT false,
  phone_call_webhook_url TEXT,
  
  -- Text AI section
  text_ai_title TEXT,
  text_ai_subtitle TEXT,
  text_ai_webhook_url TEXT,
  text_ai_enabled_platforms TEXT[],
  
  -- Form AI section
  form_ai_title TEXT,
  form_ai_subtitle TEXT,
  form_ai_webhook_url TEXT,
  
  -- Creatives section
  creatives_section_title TEXT,
  creatives_section_subtitle TEXT,
  creatives_page_name TEXT,
  creatives_page_logo TEXT,
  creatives JSONB DEFAULT '[]'::jsonb,
  
  -- Chatbot section
  chatbot_section_title TEXT,
  chatbot_section_subtitle TEXT,
  chat_widget_code TEXT,
  
  webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_pages ENABLE ROW LEVEL SECURITY;

-- Public pages viewable by anyone when published
CREATE POLICY "Anyone can view published demo pages" ON public.demo_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Users can manage demo pages for their clients" ON public.demo_pages FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 8. CUSTOM METRICS TABLE
-- ============================
CREATE TABLE public.custom_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  analytics_type TEXT NOT NULL DEFAULT 'text',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  prompt TEXT,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage custom metrics for their clients" ON public.custom_metrics FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 9. METRIC COLOR PREFERENCES TABLE
-- ============================
CREATE TABLE public.metric_color_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.metric_color_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage metric colors for their clients" ON public.metric_color_preferences FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 10. ANALYTICS CHAT THREADS (TEXT)
-- ============================
CREATE TABLE public.analytics_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Analytics Chat',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage analytics threads for their clients" ON public.analytics_chat_threads FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 11. ANALYTICS CHAT MESSAGES (TEXT)
-- ============================
CREATE TABLE public.analytics_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.analytics_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT,
  message_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage analytics messages" ON public.analytics_chat_messages FOR ALL USING (
  thread_id IN (SELECT id FROM public.analytics_chat_threads WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())))
);

-- ============================
-- 12. VOICE ANALYTICS CHAT THREADS
-- ============================
CREATE TABLE public.voice_analytics_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Voice Chat',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_analytics_chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage voice analytics threads for their clients" ON public.voice_analytics_chat_threads FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 13. VOICE ANALYTICS CHAT MESSAGES
-- ============================
CREATE TABLE public.voice_analytics_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.voice_analytics_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT,
  message_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_analytics_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage voice analytics messages" ON public.voice_analytics_chat_messages FOR ALL USING (
  thread_id IN (SELECT id FROM public.voice_analytics_chat_threads WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())))
);

-- ============================
-- 14. SUPPORT CHAT MESSAGES TABLE
-- ============================
CREATE TABLE public.support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage support chat for their clients" ON public.support_chat_messages FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 15. CONTACTS TABLE
-- ============================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_data JSONB DEFAULT '{}'::jsonb,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contacts for their clients" ON public.contacts FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 16. CONTACT AI COLUMNS TABLE
-- ============================
CREATE TABLE public.contact_ai_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  column_name TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_ai_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage AI columns for their clients" ON public.contact_ai_columns FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 17. CONTACT AI VALUES TABLE
-- ============================
CREATE TABLE public.contact_ai_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  ai_column_id UUID REFERENCES public.contact_ai_columns(id) ON DELETE CASCADE,
  generated_value TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_ai_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage AI values" ON public.contact_ai_values FOR ALL USING (
  contact_id IN (SELECT id FROM public.contacts WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())))
);

-- ============================
-- 18. WEBINAR SETUP TABLE
-- ============================
CREATE TABLE public.webinar_setup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  webinar_url TEXT,
  replay_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.webinar_setup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage webinar setup for their clients" ON public.webinar_setup FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 19. TRAFFIC WIZARD ANSWERS TABLE
-- ============================
CREATE TABLE public.traffic_wizard_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  answers JSONB DEFAULT '{}'::jsonb,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.traffic_wizard_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage traffic wizard for their clients" ON public.traffic_wizard_answers FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 20. CLIENT PORTALS TABLE
-- ============================
CREATE TABLE public.client_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL DEFAULT 'Client Onboarding Portal',
  deployment_slug TEXT UNIQUE,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage portals for their clients" ON public.client_portals FOR ALL USING (
  client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))
);

-- ============================
-- 21. PORTAL PHASES TABLE
-- ============================
CREATE TABLE public.portal_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID REFERENCES public.client_portals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage portal phases" ON public.portal_phases FOR ALL USING (
  portal_id IN (SELECT id FROM public.client_portals WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())))
);

-- ============================
-- 22. PORTAL STEPS TABLE
-- ============================
CREATE TABLE public.portal_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES public.portal_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content JSONB,
  order_index INTEGER DEFAULT 0,
  show_to_client BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage portal steps" ON public.portal_steps FOR ALL USING (
  phase_id IN (SELECT id FROM public.portal_phases WHERE portal_id IN (SELECT id FROM public.client_portals WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid()))))
);

-- ============================
-- 23. PORTAL STEP COMPLETIONS TABLE
-- ============================
CREATE TABLE public.portal_step_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID REFERENCES public.client_portals(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.portal_steps(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  form_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(portal_id, step_id)
);

ALTER TABLE public.portal_step_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage step completions" ON public.portal_step_completions FOR ALL USING (
  portal_id IN (SELECT id FROM public.client_portals WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())))
);

-- ============================
-- 24. PORTAL TASKS TABLE
-- ============================
CREATE TABLE public.portal_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID REFERENCES public.client_portals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage portal tasks" ON public.portal_tasks FOR ALL USING (
  portal_id IN (SELECT id FROM public.client_portals WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())))
);

-- ============================
-- 25. PORTAL TASK COMPLETIONS TABLE
-- ============================
CREATE TABLE public.portal_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id UUID REFERENCES public.client_portals(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.portal_tasks(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(portal_id, task_id)
);

ALTER TABLE public.portal_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage task completions" ON public.portal_task_completions FOR ALL USING (
  portal_id IN (SELECT id FROM public.client_portals WHERE client_id IN (SELECT id FROM public.clients WHERE agency_id IN (SELECT agency_id FROM public.profiles WHERE id = auth.uid())))
);

-- ============================
-- 26. RPC FUNCTIONS
-- ============================

-- Delete campaign with all associated data
CREATE OR REPLACE FUNCTION public.delete_campaign_with_data(campaign_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.leads WHERE campaign_id = campaign_id_param;
  DELETE FROM public.campaigns WHERE id = campaign_id_param;
END;
$$;

-- Delete client with all associated data
CREATE OR REPLACE FUNCTION public.delete_client_with_data(client_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.clients WHERE id = client_id_param;
END;
$$;

-- Get secure leads (for campaign detail page)
CREATE OR REPLACE FUNCTION public.get_secure_leads(campaign_id_filter UUID)
RETURNS SETOF public.leads
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.leads WHERE campaign_id = campaign_id_filter ORDER BY created_at ASC;
$$;

-- ============================
-- 27. STORAGE BUCKETS
-- ============================
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for logos bucket
CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- ============================
-- 28. UPDATED_AT TRIGGER FUNCTION
-- ============================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_demo_pages_updated_at BEFORE UPDATE ON public.demo_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_custom_metrics_updated_at BEFORE UPDATE ON public.custom_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_metric_color_preferences_updated_at BEFORE UPDATE ON public.metric_color_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_analytics_chat_threads_updated_at BEFORE UPDATE ON public.analytics_chat_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_voice_analytics_chat_threads_updated_at BEFORE UPDATE ON public.voice_analytics_chat_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_webinar_setup_updated_at BEFORE UPDATE ON public.webinar_setup FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_traffic_wizard_answers_updated_at BEFORE UPDATE ON public.traffic_wizard_answers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_portals_updated_at BEFORE UPDATE ON public.client_portals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- 29. ENABLE REALTIME FOR KEY TABLES
-- ============================
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metric_color_preferences;
