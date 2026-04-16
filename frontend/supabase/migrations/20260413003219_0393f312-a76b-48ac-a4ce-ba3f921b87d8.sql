-- Add unique webhook token to each engagement campaign
ALTER TABLE public.engagement_campaigns
ADD COLUMN enroll_webhook_token UUID NOT NULL DEFAULT gen_random_uuid();

-- Ensure uniqueness and fast lookups
CREATE UNIQUE INDEX idx_engagement_campaigns_enroll_token
ON public.engagement_campaigns (enroll_webhook_token);

-- Backfill existing rows (already handled by DEFAULT but be explicit)
UPDATE public.engagement_campaigns
SET enroll_webhook_token = gen_random_uuid()
WHERE enroll_webhook_token IS NULL;