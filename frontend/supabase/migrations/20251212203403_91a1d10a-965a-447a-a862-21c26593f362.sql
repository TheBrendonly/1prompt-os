-- Create a table to store voice call recordings and transcripts
CREATE TABLE IF NOT EXISTS public.voice_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  session_id TEXT,
  call_transcript TEXT,
  recording_url TEXT,
  call_duration_seconds INTEGER,
  caller_phone TEXT,
  call_status TEXT DEFAULT 'completed',
  call_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_call_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view voice call logs for their agency clients"
ON public.voice_call_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = voice_call_logs.client_id
));

CREATE POLICY "Users can create voice call logs for their agency clients"
ON public.voice_call_logs
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = voice_call_logs.client_id
));

CREATE POLICY "Users can update voice call logs for their agency clients"
ON public.voice_call_logs
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = voice_call_logs.client_id
));

CREATE POLICY "Users can delete voice call logs for their agency clients"
ON public.voice_call_logs
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  JOIN profiles ON profiles.agency_id = clients.agency_id
  WHERE profiles.id = auth.uid() AND clients.id = voice_call_logs.client_id
));

-- Create indexes for better performance
CREATE INDEX idx_voice_call_logs_client_id ON public.voice_call_logs(client_id);
CREATE INDEX idx_voice_call_logs_call_date ON public.voice_call_logs(call_date DESC);
CREATE INDEX idx_voice_call_logs_session_id ON public.voice_call_logs(session_id);

-- Create trigger for updated_at
CREATE TRIGGER update_voice_call_logs_updated_at
  BEFORE UPDATE ON public.voice_call_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();