INSERT INTO dashboard_widgets (client_id, campaign_id, analytics_type, widget_type, title, width, sort_order, config, is_active)
SELECT dw.client_id, dw.campaign_id, 'engagement_campaign', 'line', 'Bookings Over Time', 'half', 17, '{"chart_key":"bookings_by_day","section":"Bookings"}'::jsonb, true
FROM (SELECT DISTINCT client_id, campaign_id FROM dashboard_widgets WHERE analytics_type = 'engagement_campaign' AND campaign_id IS NOT NULL) dw
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets dw2 WHERE dw2.campaign_id = dw.campaign_id AND dw2.title = 'Bookings Over Time');

INSERT INTO dashboard_widgets (client_id, campaign_id, analytics_type, widget_type, title, width, sort_order, config, is_active)
SELECT dw.client_id, dw.campaign_id, 'engagement_campaign', 'bar_horizontal', 'Booking Funnel', 'half', 18, '{"chart_key":"booking_funnel","section":"Bookings"}'::jsonb, true
FROM (SELECT DISTINCT client_id, campaign_id FROM dashboard_widgets WHERE analytics_type = 'engagement_campaign' AND campaign_id IS NOT NULL) dw
WHERE NOT EXISTS (SELECT 1 FROM dashboard_widgets dw2 WHERE dw2.campaign_id = dw.campaign_id AND dw2.title = 'Booking Funnel');