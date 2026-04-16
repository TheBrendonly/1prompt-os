-- Table for simulation analysis chat threads
CREATE TABLE public.simulation_analysis_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id uuid NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_analysis_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage simulation analysis threads"
ON public.simulation_analysis_threads
FOR ALL
TO authenticated
USING (
    client_id IN (
        SELECT clients.id FROM clients
        WHERE clients.agency_id IN (
            SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
        )
    )
)
WITH CHECK (
    client_id IN (
        SELECT clients.id FROM clients
        WHERE clients.agency_id IN (
            SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
        )
    )
);

-- Table for simulation analysis chat messages
CREATE TABLE public.simulation_analysis_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid NOT NULL REFERENCES public.simulation_analysis_threads(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'user',
    content text,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_analysis_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage simulation analysis messages"
ON public.simulation_analysis_messages
FOR ALL
TO authenticated
USING (
    thread_id IN (
        SELECT id FROM simulation_analysis_threads
        WHERE client_id IN (
            SELECT clients.id FROM clients
            WHERE clients.agency_id IN (
                SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
            )
        )
    )
)
WITH CHECK (
    thread_id IN (
        SELECT id FROM simulation_analysis_threads
        WHERE client_id IN (
            SELECT clients.id FROM clients
            WHERE clients.agency_id IN (
                SELECT profiles.agency_id FROM profiles WHERE profiles.id = auth.uid()
            )
        )
    )
);