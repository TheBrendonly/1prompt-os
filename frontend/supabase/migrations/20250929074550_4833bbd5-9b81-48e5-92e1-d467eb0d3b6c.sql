-- Create table for storing customer contact information
CREATE TABLE public.customer_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  contact_method VARCHAR(10) NOT NULL CHECK (contact_method IN ('email', 'phone')),
  email TEXT,
  phone TEXT,
  country_code VARCHAR(5),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure we have either email or phone
  CONSTRAINT check_contact_info CHECK (
    (contact_method = 'email' AND email IS NOT NULL) OR 
    (contact_method = 'phone' AND phone IS NOT NULL AND country_code IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access using the correct profiles table structure
CREATE POLICY "Users can view customer contacts for their clients" 
ON public.customer_contacts 
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM public.clients c 
    INNER JOIN public.profiles p ON c.agency_id = p.agency_id 
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can create customer contacts for their clients" 
ON public.customer_contacts 
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT c.id FROM public.clients c 
    INNER JOIN public.profiles p ON c.agency_id = p.agency_id 
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can update customer contacts for their clients" 
ON public.customer_contacts 
FOR UPDATE 
USING (
  client_id IN (
    SELECT c.id FROM public.clients c 
    INNER JOIN public.profiles p ON c.agency_id = p.agency_id 
    WHERE p.id = auth.uid()
  )
);

CREATE POLICY "Users can delete customer contacts for their clients" 
ON public.customer_contacts 
FOR DELETE 
USING (
  client_id IN (
    SELECT c.id FROM public.clients c 
    INNER JOIN public.profiles p ON c.agency_id = p.agency_id 
    WHERE p.id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customer_contacts_updated_at
BEFORE UPDATE ON public.customer_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_customer_contacts_client_id ON public.customer_contacts(client_id);
CREATE INDEX idx_customer_contacts_email ON public.customer_contacts(email) WHERE contact_method = 'email';
CREATE INDEX idx_customer_contacts_phone ON public.customer_contacts(phone) WHERE contact_method = 'phone';