
-- Simulations table: stores each simulation run
CREATE TABLE public.simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  business_info text,
  test_goal text,
  test_specifics text,
  num_conversations integer NOT NULL DEFAULT 5,
  min_messages integer NOT NULL DEFAULT 3,
  max_messages integer NOT NULL DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Simulation personas table
CREATE TABLE public.simulation_personas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id uuid NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  name text NOT NULL,
  age integer,
  gender text,
  occupation text,
  problem text,
  hobbies text,
  goal text,
  avatar_seed text,
  assigned_message_count integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Simulation messages table
CREATE TABLE public.simulation_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id uuid NOT NULL REFERENCES public.simulation_personas(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text,
  message_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_messages ENABLE ROW LEVEL SECURITY;

-- RLS: simulations
CREATE POLICY "Users can manage simulations for their clients"
ON public.simulations FOR ALL TO authenticated
USING (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
  )
))
WITH CHECK (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
  )
));

-- RLS: simulation_personas
CREATE POLICY "Users can manage simulation personas"
ON public.simulation_personas FOR ALL TO authenticated
USING (simulation_id IN (
  SELECT s.id FROM simulations s
  WHERE s.client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
))
WITH CHECK (simulation_id IN (
  SELECT s.id FROM simulations s
  WHERE s.client_id IN (
    SELECT clients.id FROM clients
    WHERE clients.agency_id IN (
      SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
    )
  )
));

-- RLS: simulation_messages
CREATE POLICY "Users can manage simulation messages"
ON public.simulation_messages FOR ALL TO authenticated
USING (persona_id IN (
  SELECT sp.id FROM simulation_personas sp
  WHERE sp.simulation_id IN (
    SELECT s.id FROM simulations s
    WHERE s.client_id IN (
      SELECT clients.id FROM clients
      WHERE clients.agency_id IN (
        SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  )
))
WITH CHECK (persona_id IN (
  SELECT sp.id FROM simulation_personas sp
  WHERE sp.simulation_id IN (
    SELECT s.id FROM simulations s
    WHERE s.client_id IN (
      SELECT clients.id FROM clients
      WHERE clients.agency_id IN (
        SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  )
));
