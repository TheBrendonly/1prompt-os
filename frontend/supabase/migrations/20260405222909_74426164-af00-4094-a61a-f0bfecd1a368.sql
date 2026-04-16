
CREATE TABLE public.chat_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, lead_id)
);

ALTER TABLE public.chat_read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chat read status for their clients"
ON public.chat_read_status
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
