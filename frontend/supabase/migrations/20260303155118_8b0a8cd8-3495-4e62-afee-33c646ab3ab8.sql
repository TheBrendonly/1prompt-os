
-- Create prompt_chat_threads table
CREATE TABLE public.prompt_chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage prompt chat threads" ON public.prompt_chat_threads FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_prompt_chat_threads_updated_at BEFORE UPDATE ON public.prompt_chat_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create prompt_chat_messages table
CREATE TABLE public.prompt_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES public.prompt_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT,
  message_type TEXT DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage prompt chat messages" ON public.prompt_chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Create presentation_chat_threads table
CREATE TABLE public.presentation_chat_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Presentation Chat',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.presentation_chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage presentation chat threads" ON public.presentation_chat_threads FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_presentation_chat_threads_updated_at BEFORE UPDATE ON public.presentation_chat_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create presentation_chat_messages table
CREATE TABLE public.presentation_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES public.presentation_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT,
  message_type TEXT DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.presentation_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage presentation chat messages" ON public.presentation_chat_messages FOR ALL USING (true) WITH CHECK (true);
