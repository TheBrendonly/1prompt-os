
-- 1. Delete Booking Funnel widgets
DELETE FROM dashboard_widgets
WHERE title = 'Booking Funnel'
  AND analytics_type = 'engagement_campaign';

-- 2. Insert separator widgets and re-sort for existing campaigns
DO $$
DECLARE
  v_campaign_id uuid;
  v_client_id uuid;
  rec RECORD;
  new_order INT;
  sep_titles TEXT[] := ARRAY['Overview','SMS','WhatsApp','Voice','Bookings','Timing','Step Performance','Charts'];
  sep_sections TEXT[] := ARRAY['Overview','SMS','WhatsApp','Voice','Bookings','Timing','Step Performance','Charts'];
  i INT;
BEGIN
  FOR rec IN
    SELECT DISTINCT campaign_id, client_id
    FROM dashboard_widgets
    WHERE analytics_type = 'engagement_campaign'
      AND campaign_id IS NOT NULL
  LOOP
    v_campaign_id := rec.campaign_id;
    v_client_id := rec.client_id;

    -- Insert separator widgets if they don't exist yet
    FOR i IN 1..array_length(sep_titles, 1) LOOP
      IF NOT EXISTS (
        SELECT 1 FROM dashboard_widgets
        WHERE campaign_id = v_campaign_id
          AND widget_type = 'separator'
          AND title = sep_titles[i]
      ) THEN
        INSERT INTO dashboard_widgets (client_id, campaign_id, analytics_type, widget_type, title, width, sort_order, config, is_active)
        VALUES (v_client_id, v_campaign_id, 'engagement_campaign', 'separator', sep_titles[i], 'full', 0,
                jsonb_build_object('section', sep_sections[i]), true);
      END IF;
    END LOOP;

    -- Re-sort all active widgets for this campaign
    new_order := 0;
    FOR rec IN
      SELECT id, widget_type, config
      FROM dashboard_widgets
      WHERE campaign_id = v_campaign_id
        AND analytics_type = 'engagement_campaign'
        AND is_active = true
        AND title != 'Bookings Over Time'
      ORDER BY
        CASE widget_type
          WHEN 'separator' THEN
            CASE config->>'section'
              WHEN 'Overview' THEN 0
              WHEN 'SMS' THEN 100
              WHEN 'WhatsApp' THEN 200
              WHEN 'Voice' THEN 300
              WHEN 'Bookings' THEN 400
              WHEN 'Timing' THEN 500
              WHEN 'Step Performance' THEN 600
              WHEN 'Charts' THEN 700
              ELSE 800
            END
          ELSE
            CASE config->>'section'
              WHEN 'Overview' THEN 10
              WHEN 'SMS' THEN 110
              WHEN 'WhatsApp' THEN 210
              WHEN 'Voice' THEN 310
              WHEN 'Bookings' THEN 410
              WHEN 'Timing' THEN 510
              WHEN 'Step Performance' THEN 610
              WHEN 'Charts' THEN 710
              ELSE 810
            END
        END,
        sort_order
    LOOP
      UPDATE dashboard_widgets SET sort_order = new_order WHERE id = rec.id;
      new_order := new_order + 1;
    END LOOP;

    -- Move "Bookings Over Time" to the very end
    UPDATE dashboard_widgets
    SET sort_order = new_order,
        config = jsonb_set(COALESCE(config, '{}'::jsonb), '{section}', '"Charts"')
    WHERE campaign_id = v_campaign_id
      AND title = 'Bookings Over Time'
      AND analytics_type = 'engagement_campaign';

  END LOOP;
END $$;
