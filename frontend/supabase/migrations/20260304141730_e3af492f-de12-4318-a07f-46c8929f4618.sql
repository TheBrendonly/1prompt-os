
-- Add missing columns
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS category text;

-- Create chat_analytics_messages table
CREATE TABLE public.chat_analytics_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_analytics_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chat analytics messages for their clients"
ON public.chat_analytics_messages
FOR ALL
TO authenticated
USING (client_id IN (
  SELECT clients.id FROM clients
  WHERE clients.agency_id IN (
    SELECT profiles.agency_id FROM profiles
    WHERE profiles.id = auth.uid()
  )
));
