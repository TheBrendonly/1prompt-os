-- Add unique constraint for upsert on contact_ai_values
ALTER TABLE public.contact_ai_values
  ADD CONSTRAINT contact_ai_values_contact_column_unique UNIQUE (contact_id, ai_column_id);
