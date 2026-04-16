-- ============================================================
-- 1Prompt — Client Supabase Schema
--
-- This schema goes in the CLIENT'S OWN Supabase project —
-- NOT your platform database (that's schema.sql).
--
-- Every client you onboard needs their own Supabase project
-- with these tables. n8n reads and writes to this database.
-- Trigger.dev upserts leads and writes follow-up messages here.
--
-- After running this, store the project's URL and service role
-- key in the `clients` table of your platform database:
--   supabase_url = 'https://xxxxx.supabase.co'
--   supabase_service_key = 'your-service-role-key'
--   supabase_table_name = 'leads'  (default, can be changed)
-- ============================================================


-- ── leads ─────────────────────────────────────────────────────────────────────
-- One row per contact (GHL Contact_ID).
-- Trigger.dev upserts here when a new lead is seen for the first time.
-- n8n reads this to look up contact details.
--
-- The `id` column must store the GHL Contact_ID — not a UUID.
-- This is the value passed as `Contact_ID` in the GHL webhook.
create table if not exists leads (
  id text primary key,
  -- GHL Contact_ID — e.g. "abc123xyz"

  first_name text,
  last_name text,
  email text,
  phone text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ── chat_history ──────────────────────────────────────────────────────────────
-- Full conversation log between the lead and the AI setter.
-- n8n reads the most recent messages for context before generating a reply.
-- Trigger.dev writes here when a follow-up message is sent.
--
-- Each row is one message. The `message` column is a JSON object
-- that follows the LangChain message format (used by n8n AI nodes).
create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  -- GHL Contact_ID — matches `leads.id`

  message jsonb not null,
  -- JSON object with this structure:
  --
  -- For a message FROM the lead (inbound):
  -- {
  --   "type": "human",
  --   "content": "Hey I'm interested in your service",
  --   "additional_kwargs": {},
  --   "response_metadata": {}
  -- }
  --
  -- For a message FROM the setter (outbound):
  -- {
  --   "type": "ai",
  --   "content": "Hey! Thanks for reaching out...",
  --   "tool_calls": [],
  --   "invalid_tool_calls": [],
  --   "additional_kwargs": {},
  --   "response_metadata": {}
  -- }

  timestamp timestamptz default now()
);
create index if not exists idx_chat_history_session
  on chat_history (session_id, timestamp desc);


-- ── text_prompts ──────────────────────────────────────────────────────────────
-- Stores the system prompt for each setter slot.
-- n8n reads this before every LLM call to get the setter's personality,
-- instructions, and behavior rules.
--
-- One row per setter slot per client.
-- The `card_name` must match the slot ID used in `agent_settings`:
--   'Setter-1', 'Setter-2', etc.
create table if not exists text_prompts (
  id uuid primary key default gen_random_uuid(),
  card_name text not null unique,
  -- 'Setter-1', 'Setter-2', etc.
  -- Must match the Setter_Number sent in the GHL webhook (prefixed with 'Setter-')

  system_prompt text,
  -- The full system prompt for this setter.
  -- Written and managed through the 1Prompt dashboard.
  -- n8n injects this into the LLM call before every reply.

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ── Seed: create default setter slot ─────────────────────────────────────────
-- Insert a placeholder row for Setter-1 so n8n has something to read
-- before the client configures their actual prompt in the dashboard.
-- Update the system_prompt through the 1Prompt dashboard.
insert into text_prompts (card_name, system_prompt)
values (
  'Setter-1',
  'You are a professional AI setter. Your job is to respond to inbound leads on behalf of the business, qualify them, and book appointments. Be friendly, concise, and helpful.'
)
on conflict (card_name) do nothing;
