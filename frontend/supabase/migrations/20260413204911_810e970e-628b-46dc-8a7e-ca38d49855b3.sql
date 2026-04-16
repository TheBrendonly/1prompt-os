UPDATE campaign_events
SET metadata = jsonb_set(
  metadata,
  '{message_body}',
  '"WhatsApp Template from GoHighLevel: \"waitlist_chat_here\""'
)
WHERE id = '50d7df1b-b9e9-4216-9d4e-54d5a12888aa';