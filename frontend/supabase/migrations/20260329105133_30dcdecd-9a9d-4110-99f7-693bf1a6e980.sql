
-- Workflows table: stores workflow definitions per client
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Workflow',
  description text,
  is_active boolean NOT NULL DEFAULT false,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workflows for their clients"
  ON public.workflows FOR ALL TO authenticated
  USING (client_id IN (
    SELECT c.id FROM clients c
    WHERE c.agency_id IN (
      SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
    )
  ))
  WITH CHECK (client_id IN (
    SELECT c.id FROM clients c
    WHERE c.agency_id IN (
      SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
    )
  ));

-- Workflow executions: logs each trigger firing
CREATE TABLE public.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running',
  trigger_type text NOT NULL,
  trigger_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_message text
);

ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage workflow executions for their clients"
  ON public.workflow_executions FOR ALL TO authenticated
  USING (client_id IN (
    SELECT c.id FROM clients c
    WHERE c.agency_id IN (
      SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
    )
  ))
  WITH CHECK (client_id IN (
    SELECT c.id FROM clients c
    WHERE c.agency_id IN (
      SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
    )
  ));

-- Workflow execution steps: logs each node execution within a workflow run
CREATE TABLE public.workflow_execution_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  node_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.workflow_execution_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view execution steps via execution"
  ON public.workflow_execution_steps FOR ALL TO authenticated
  USING (execution_id IN (
    SELECT we.id FROM workflow_executions we
    WHERE we.client_id IN (
      SELECT c.id FROM clients c
      WHERE c.agency_id IN (
        SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  ))
  WITH CHECK (execution_id IN (
    SELECT we.id FROM workflow_executions we
    WHERE we.client_id IN (
      SELECT c.id FROM clients c
      WHERE c.agency_id IN (
        SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  ));
