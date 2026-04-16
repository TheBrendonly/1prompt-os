-- Add system_prompt column to clients table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'clients' AND column_name = 'system_prompt') THEN
        ALTER TABLE public.clients ADD COLUMN system_prompt text;
    END IF;
END $$;