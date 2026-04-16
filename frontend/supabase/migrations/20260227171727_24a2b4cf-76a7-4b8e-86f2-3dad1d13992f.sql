
-- Contacts table: stores all imported contacts for a client
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  external_id text, -- original ID from CSV if provided
  contact_data jsonb NOT NULL DEFAULT '{}'::jsonb, -- all contact fields as key-value
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- AI columns configuration
CREATE TABLE public.contact_ai_columns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  column_name text NOT NULL,
  prompt_template text NOT NULL, -- template with {field} references
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- AI column generated values
CREATE TABLE public.contact_ai_values (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  ai_column_id uuid NOT NULL REFERENCES public.contact_ai_columns(id) ON DELETE CASCADE,
  generated_value text,
  status text NOT NULL DEFAULT 'pending', -- pending, generating, completed, failed
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(contact_id, ai_column_id)
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_ai_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_ai_values ENABLE ROW LEVEL SECURITY;

-- RLS for contacts
CREATE POLICY "Users can manage contacts for their agency clients"
ON public.contacts FOR ALL
USING (EXISTS (
  SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = contacts.client_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = contacts.client_id
));

-- RLS for ai columns
CREATE POLICY "Users can manage AI columns for their agency clients"
ON public.contact_ai_columns FOR ALL
USING (EXISTS (
  SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = contact_ai_columns.client_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM clients JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = contact_ai_columns.client_id
));

-- RLS for ai values
CREATE POLICY "Users can manage AI values for their agency contacts"
ON public.contact_ai_values FOR ALL
USING (EXISTS (
  SELECT 1 FROM contacts
  JOIN clients ON clients.id = contacts.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND contacts.id = contact_ai_values.contact_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM contacts
  JOIN clients ON clients.id = contacts.client_id
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND contacts.id = contact_ai_values.contact_id
));

-- Indexes
CREATE INDEX idx_contacts_client_id ON public.contacts(client_id);
CREATE INDEX idx_contact_ai_columns_client_id ON public.contact_ai_columns(client_id);
CREATE INDEX idx_contact_ai_values_contact_id ON public.contact_ai_values(contact_id);
CREATE INDEX idx_contact_ai_values_ai_column_id ON public.contact_ai_values(ai_column_id);

-- Update trigger for contacts
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_ai_columns_updated_at
BEFORE UPDATE ON public.contact_ai_columns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_ai_values_updated_at
BEFORE UPDATE ON public.contact_ai_values
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
