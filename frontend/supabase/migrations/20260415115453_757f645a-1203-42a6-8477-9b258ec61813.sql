
-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ghl_contact_id text,
  ghl_appointment_id text UNIQUE,
  campaign_id uuid REFERENCES public.engagement_campaigns(id) ON DELETE SET NULL,
  setter_name text,
  setter_type text,
  title text,
  start_time timestamptz,
  end_time timestamptz,
  status text NOT NULL DEFAULT 'confirmed',
  location text,
  notes text,
  calendar_id text,
  cancellation_link text,
  reschedule_link text,
  raw_ghl_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX idx_bookings_lead_id ON public.bookings(lead_id);
CREATE INDEX idx_bookings_campaign_id ON public.bookings(campaign_id);
CREATE INDEX idx_bookings_start_time ON public.bookings(start_time);

-- RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on bookings"
  ON public.bookings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view their client bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = (
        SELECT agency_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- Create sync_ghl_booking_executions table
CREATE TABLE public.sync_ghl_booking_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  contact_name text,
  status text NOT NULL,
  error_message text,
  steps jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_ghl_booking_exec_client ON public.sync_ghl_booking_executions(client_id);

ALTER TABLE public.sync_ghl_booking_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on sync_ghl_booking_executions"
  ON public.sync_ghl_booking_executions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view their client booking executions"
  ON public.sync_ghl_booking_executions FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE agency_id = (
        SELECT agency_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );
