UPDATE campaign_events
SET metadata = jsonb_set(
  metadata,
  '{message_body}',
  '"WhatsApp Template from GoHighLevel: \"waitlist_chat_here\""'
)
WHERE campaign_id = 'f04ceca2-419e-4497-88fb-2c9457dbfd88'
  AND event_type = 'message_sent'
  AND channel = 'whatsapp';