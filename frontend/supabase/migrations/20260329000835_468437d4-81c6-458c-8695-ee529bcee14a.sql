
-- Add Twilio credentials to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS twilio_account_sid text DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS twilio_auth_token text DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS twilio_default_phone text DEFAULT NULL;

-- Create demo page contacts table
CREATE TABLE public.demo_page_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone_number text NOT NULL,
  notes text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_page_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage demo page contacts for their clients"
ON public.demo_page_contacts
FOR ALL
TO authenticated
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

-- Create SMS messages table
CREATE TABLE public.sms_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.demo_page_contacts(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  body text NOT NULL,
  twilio_sid text DEFAULT NULL,
  status text NOT NULL DEFAULT 'sent',
  from_number text DEFAULT NULL,
  to_number text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sms messages for their clients"
ON public.sms_messages
FOR ALL
TO authenticated
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

-- Allow service role to insert inbound messages (from webhook)
CREATE POLICY "Service role can insert sms messages"
ON public.sms_messages
FOR INSERT
TO service_role
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_sms_messages_contact_id ON public.sms_messages(contact_id);
CREATE INDEX idx_sms_messages_client_id ON public.sms_messages(client_id);
CREATE INDEX idx_demo_page_contacts_client_id ON public.demo_page_contacts(client_id);
CREATE INDEX idx_sms_messages_created_at ON public.sms_messages(created_at);
