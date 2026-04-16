ALTER TABLE public.client_custom_fields ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.contact_tags ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;