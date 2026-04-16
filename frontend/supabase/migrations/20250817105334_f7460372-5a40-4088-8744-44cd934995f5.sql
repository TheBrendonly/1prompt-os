-- Create agencies table
CREATE TABLE public.agencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update profiles table to link to agencies
ALTER TABLE public.profiles ADD COLUMN agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE;

-- Update campaigns table to be client-scoped
ALTER TABLE public.campaigns ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Create prompts table for prompt management
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_base table for knowledge management
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agencies
CREATE POLICY "Users can view their own agency" 
ON public.agencies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.agency_id = agencies.id
  )
);

CREATE POLICY "Users can update their own agency" 
ON public.agencies 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.agency_id = agencies.id
  )
);

-- RLS Policies for clients
CREATE POLICY "Agency users can view their clients" 
ON public.clients 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.agency_id = clients.agency_id
  )
);

CREATE POLICY "Agency users can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.agency_id = clients.agency_id
  )
);

CREATE POLICY "Agency users can update their clients" 
ON public.clients 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.agency_id = clients.agency_id
  )
);

CREATE POLICY "Agency users can delete their clients" 
ON public.clients 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.agency_id = clients.agency_id
  )
);

-- Update campaigns RLS policies to be client-scoped
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;

CREATE POLICY "Users can view campaigns for their agency clients" 
ON public.campaigns 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = campaigns.client_id
  )
);

CREATE POLICY "Users can create campaigns for their agency clients" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = campaigns.client_id
  )
);

CREATE POLICY "Users can update campaigns for their agency clients" 
ON public.campaigns 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = campaigns.client_id
  )
);

CREATE POLICY "Users can delete campaigns for their agency clients" 
ON public.campaigns 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = campaigns.client_id
  )
);

-- RLS Policies for prompts
CREATE POLICY "Users can view prompts for their agency clients" 
ON public.prompts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = prompts.client_id
  )
);

CREATE POLICY "Users can create prompts for their agency clients" 
ON public.prompts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = prompts.client_id
  )
);

CREATE POLICY "Users can update prompts for their agency clients" 
ON public.prompts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = prompts.client_id
  )
);

CREATE POLICY "Users can delete prompts for their agency clients" 
ON public.prompts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = prompts.client_id
  )
);

-- RLS Policies for knowledge_base
CREATE POLICY "Users can view knowledge base for their agency clients" 
ON public.knowledge_base 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = knowledge_base.client_id
  )
);

CREATE POLICY "Users can create knowledge base for their agency clients" 
ON public.knowledge_base 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = knowledge_base.client_id
  )
);

CREATE POLICY "Users can update knowledge base for their agency clients" 
ON public.knowledge_base 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = knowledge_base.client_id
  )
);

CREATE POLICY "Users can delete knowledge base for their agency clients" 
ON public.knowledge_base 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    JOIN public.profiles ON profiles.agency_id = clients.agency_id
    WHERE profiles.id = auth.uid() 
    AND clients.id = knowledge_base.client_id
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();