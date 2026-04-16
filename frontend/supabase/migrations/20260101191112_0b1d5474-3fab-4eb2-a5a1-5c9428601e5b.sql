-- Create Client Portal tables

-- Main portal table
CREATE TABLE public.client_portals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Client Portal',
  deployment_slug TEXT UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portal phases (like setup guide phases)
CREATE TABLE public.portal_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portal steps (within phases)
CREATE TABLE public.portal_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.portal_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL DEFAULT 0,
  show_to_client BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portal step completions (client progress)
CREATE TABLE public.portal_step_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_id UUID NOT NULL REFERENCES public.portal_steps(id) ON DELETE CASCADE,
  portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  form_data JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(step_id, portal_id)
);

-- Portal tasks (to-do list)
CREATE TABLE public.portal_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portal task completions
CREATE TABLE public.portal_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.portal_tasks(id) ON DELETE CASCADE,
  portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, portal_id)
);

-- Enable RLS on all tables
ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_step_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_task_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_portals
CREATE POLICY "Users can view portals for their agency clients"
ON public.client_portals FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.clients
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = client_portals.client_id
));

CREATE POLICY "Users can create portals for their agency clients"
ON public.client_portals FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.clients
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = client_portals.client_id
));

CREATE POLICY "Users can update portals for their agency clients"
ON public.client_portals FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.clients
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = client_portals.client_id
));

CREATE POLICY "Users can delete portals for their agency clients"
ON public.client_portals FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.clients
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = client_portals.client_id
));

-- Public access for published portals
CREATE POLICY "Public can view published portals"
ON public.client_portals FOR SELECT
USING (is_published = true);

-- RLS policies for portal_phases
CREATE POLICY "Users can manage phases for their portals"
ON public.portal_phases FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.client_portals
  JOIN public.clients ON clients.id = client_portals.client_id
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND client_portals.id = portal_phases.portal_id
));

CREATE POLICY "Public can view phases for published portals"
ON public.portal_phases FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.client_portals
  WHERE client_portals.id = portal_phases.portal_id AND client_portals.is_published = true
));

-- RLS policies for portal_steps
CREATE POLICY "Users can manage steps for their portals"
ON public.portal_steps FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.portal_phases
  JOIN public.client_portals ON client_portals.id = portal_phases.portal_id
  JOIN public.clients ON clients.id = client_portals.client_id
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND portal_phases.id = portal_steps.phase_id
));

CREATE POLICY "Public can view steps for published portals"
ON public.portal_steps FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.portal_phases
  JOIN public.client_portals ON client_portals.id = portal_phases.portal_id
  WHERE portal_phases.id = portal_steps.phase_id 
  AND client_portals.is_published = true 
  AND portal_steps.show_to_client = true
));

-- RLS policies for portal_step_completions
CREATE POLICY "Users can manage step completions for their portals"
ON public.portal_step_completions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.client_portals
  JOIN public.clients ON clients.id = client_portals.client_id
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND client_portals.id = portal_step_completions.portal_id
));

CREATE POLICY "Public can manage completions for published portals"
ON public.portal_step_completions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.client_portals
  WHERE client_portals.id = portal_step_completions.portal_id AND client_portals.is_published = true
));

-- RLS policies for portal_tasks
CREATE POLICY "Users can manage tasks for their portals"
ON public.portal_tasks FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.client_portals
  JOIN public.clients ON clients.id = client_portals.client_id
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND client_portals.id = portal_tasks.portal_id
));

CREATE POLICY "Public can view tasks for published portals"
ON public.portal_tasks FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.client_portals
  WHERE client_portals.id = portal_tasks.portal_id AND client_portals.is_published = true
));

-- RLS policies for portal_task_completions
CREATE POLICY "Users can manage task completions for their portals"
ON public.portal_task_completions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.client_portals
  JOIN public.clients ON clients.id = client_portals.client_id
  JOIN public.profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND client_portals.id = portal_task_completions.portal_id
));

CREATE POLICY "Public can manage task completions for published portals"
ON public.portal_task_completions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.client_portals
  WHERE client_portals.id = portal_task_completions.portal_id AND client_portals.is_published = true
));

-- Create indexes for performance
CREATE INDEX idx_portal_phases_portal_id ON public.portal_phases(portal_id);
CREATE INDEX idx_portal_phases_order ON public.portal_phases(portal_id, order_index);
CREATE INDEX idx_portal_steps_phase_id ON public.portal_steps(phase_id);
CREATE INDEX idx_portal_steps_order ON public.portal_steps(phase_id, order_index);
CREATE INDEX idx_portal_step_completions_step ON public.portal_step_completions(step_id);
CREATE INDEX idx_portal_step_completions_portal ON public.portal_step_completions(portal_id);
CREATE INDEX idx_portal_tasks_portal_id ON public.portal_tasks(portal_id);
CREATE INDEX idx_portal_tasks_order ON public.portal_tasks(portal_id, order_index);
CREATE INDEX idx_portal_task_completions_task ON public.portal_task_completions(task_id);
CREATE INDEX idx_client_portals_slug ON public.client_portals(deployment_slug);
CREATE INDEX idx_client_portals_client ON public.client_portals(client_id);

-- Triggers for updated_at
CREATE TRIGGER update_client_portals_updated_at
BEFORE UPDATE ON public.client_portals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_phases_updated_at
BEFORE UPDATE ON public.portal_phases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_steps_updated_at
BEFORE UPDATE ON public.portal_steps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_step_completions_updated_at
BEFORE UPDATE ON public.portal_step_completions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_tasks_updated_at
BEFORE UPDATE ON public.portal_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portal_task_completions_updated_at
BEFORE UPDATE ON public.portal_task_completions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();