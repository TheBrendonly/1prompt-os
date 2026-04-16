-- Add schedule configuration fields to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN days_of_week integer[] DEFAULT '{1,2,3,4,5}',
ADD COLUMN start_time text DEFAULT '09:00',
ADD COLUMN end_time text DEFAULT '17:00', 
ADD COLUMN timezone text DEFAULT 'America/New_York',
ADD COLUMN batch_size integer DEFAULT 10,
ADD COLUMN batch_interval_minutes integer DEFAULT 15,
ADD COLUMN lead_delay_seconds integer DEFAULT 5;