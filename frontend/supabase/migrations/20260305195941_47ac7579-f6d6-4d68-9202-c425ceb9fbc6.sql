
CREATE TABLE public.contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#646E82',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.contact_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES public.contact_tags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);

ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contact tags" ON public.contact_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage tag assignments" ON public.contact_tag_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
