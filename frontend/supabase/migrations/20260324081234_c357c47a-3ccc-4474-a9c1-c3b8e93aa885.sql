CREATE TABLE public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  attempt_number integer NOT NULL DEFAULT 1,
  attempt_type text NOT NULL DEFAULT 'automatic',
  result text NOT NULL DEFAULT 'failed',
  failure_reason text,
  stripe_invoice_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment attempts for their clients"
ON public.payment_attempts
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT c.id FROM clients c
    WHERE c.agency_id IN (
      SELECT p.agency_id FROM profiles p WHERE p.id = auth.uid()
    )
  )
);

CREATE INDEX idx_payment_attempts_client_id ON public.payment_attempts(client_id);
CREATE INDEX idx_payment_attempts_attempted_at ON public.payment_attempts(attempted_at DESC);