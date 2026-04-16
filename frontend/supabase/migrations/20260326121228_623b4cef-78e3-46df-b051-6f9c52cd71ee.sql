-- ICP profiles table: each simulation can have multiple ICPs
CREATE TABLE public.simulation_icp_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id uuid NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'ICP Profile',
  description text,
  persona_count integer NOT NULL DEFAULT 3,
  age_min integer NOT NULL DEFAULT 18,
  age_max integer NOT NULL DEFAULT 65,
  gender text NOT NULL DEFAULT 'any',
  location text,
  behaviors text[] NOT NULL DEFAULT ARRAY['friendly','skeptical','inquisitive']::text[],
  lead_trigger text,
  lead_knowledge text,
  concerns text,
  scenario_items text[] NOT NULL DEFAULT ARRAY[]::text[],
  test_booking boolean NOT NULL DEFAULT false,
  test_cancellation boolean NOT NULL DEFAULT false,
  test_reschedule boolean NOT NULL DEFAULT false,
  booking_count integer NOT NULL DEFAULT 0,
  cancel_reschedule_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.simulation_personas ADD COLUMN icp_profile_id uuid REFERENCES public.simulation_icp_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.simulation_icp_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ICP profiles for their simulations"
ON public.simulation_icp_profiles
FOR ALL
TO authenticated
USING (
  simulation_id IN (
    SELECT s.id FROM simulations s
    WHERE s.client_id IN (
      SELECT c.id FROM clients c
      WHERE c.agency_id IN (
        SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  simulation_id IN (
    SELECT s.id FROM simulations s
    WHERE s.client_id IN (
      SELECT c.id FROM clients c
      WHERE c.agency_id IN (
        SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  )
);