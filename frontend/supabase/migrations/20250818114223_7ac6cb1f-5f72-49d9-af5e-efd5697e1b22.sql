-- Fix Critical Security Issue: Add RLS to secure_leads view

-- 1. Drop and recreate secure_leads view with proper RLS
DROP VIEW IF EXISTS public.secure_leads;

-- 2. Create secure function instead of view for better RLS control
CREATE OR REPLACE FUNCTION public.get_secure_leads(campaign_id_filter uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  campaign_id uuid,
  status text,
  scheduled_for timestamptz,
  processed_at timestamptz,
  created_at timestamptz,
  error_message text,
  lead_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.campaign_id,
    l.status,
    l.scheduled_for,
    l.processed_at,
    l.created_at,
    l.error_message,
    -- Conditionally mask lead_data based on user access level
    CASE 
      WHEN public.user_has_full_lead_access(l.campaign_id) THEN l.lead_data
      ELSE public.mask_sensitive_lead_data(l.lead_data)
    END as lead_data
  FROM public.leads l
  WHERE 
    -- Apply RLS: user must have access to the campaign
    EXISTS (
      SELECT 1
      FROM ((campaigns c
        JOIN clients cl ON ((cl.id = c.client_id)))
        JOIN profiles p ON ((p.agency_id = cl.agency_id)))
      WHERE ((c.id = l.campaign_id) AND (p.id = auth.uid()))
    )
    -- Optional campaign filter
    AND (campaign_id_filter IS NULL OR l.campaign_id = campaign_id_filter)
  ORDER BY l.scheduled_for ASC NULLS LAST;
END;
$function$;

-- 3. Create wrapper view that calls the secure function (for backwards compatibility)
CREATE OR REPLACE VIEW public.secure_leads_view AS
SELECT * FROM public.get_secure_leads();

-- 4. Enable RLS on the view (even though it's redundant, good practice)
ALTER VIEW public.secure_leads_view SET (security_invoker = true);

-- 5. Add grants for the function
GRANT EXECUTE ON FUNCTION public.get_secure_leads TO authenticated;
GRANT SELECT ON public.secure_leads_view TO authenticated;