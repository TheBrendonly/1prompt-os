
CREATE TABLE public.chat_starred (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_id, lead_id)
);

ALTER TABLE public.chat_starred ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view starred chats"
  ON public.chat_starred FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert starred chats"
  ON public.chat_starred FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete starred chats"
  ON public.chat_starred FOR DELETE TO authenticated USING (true);
