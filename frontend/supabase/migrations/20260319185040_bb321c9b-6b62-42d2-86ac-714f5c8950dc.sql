
-- Add subscription fields to profiles (agency-level billing)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;

-- Add subscription fields to clients (sub-account billing)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;
