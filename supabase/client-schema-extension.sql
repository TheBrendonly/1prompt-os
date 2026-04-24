-- ============================================================
-- 1Prompt — Client Supabase Schema Extension
--
-- Adds the tables the Text_Engine_Setter n8n workflow reads
-- beyond the base client-schema.sql, plus the voice_prompts
-- table read/written by the save-external-prompt edge function
-- when Voice Setter slots are saved from the dashboard:
--   1. credentials   — per-agency API keys (GHL, etc.)
--   2. prompts       — positional prompt store used for followups
--   3. documents     — pgvector knowledge base (RAG)
--   4. voice_prompts — one row per Voice-Setter slot (Setter-N)
--
-- Apply this to the CLIENT's Supabase project (bfd-setter-live),
-- AFTER client-schema.sql.
-- ============================================================


-- ── credentials ───────────────────────────────────────────────
-- One row per agency. n8n's Get_API_Credentials3 node does a
-- plain SELECT * on this table and reads `.data[0].gohighlevel_*`.
-- Text_Engine_Setter workflow column references (all TEXT):
--   gohighlevel_assignee_id
--   gohighlevel_calendar_id
--   gohighlevel_location_id
--   gohighlevel_api_key
--   gohighlevel_booking_title
create table if not exists credentials (
  id uuid primary key default gen_random_uuid(),

  gohighlevel_api_key text,
  gohighlevel_location_id text,
  gohighlevel_calendar_id text,
  gohighlevel_assignee_id text,
  gohighlevel_booking_title text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ── prompts ───────────────────────────────────────────────────
-- Positional prompt store. The Text_Engine_Setter workflow does
-- SELECT * with returnAll=true, then reads `.data[10]` — i.e. the
-- row at array index 10 is expected to be the Setter-1 followup
-- prompt. Seed with 11+ rows so index 10 resolves.
--
-- Columns referenced by the workflow:
--   data[10].id                       → Agent_No (number)
--   data[10].title                    → Agent_Title (string)
--   data[10].content                  → Agent_Prompt (string)
--   data[10].model                    → LLM_Model (string)
--   data[10].followup_delay_seconds   → File_Processing_Enabled (treated as bool)
create table if not exists prompts (
  id bigint primary key,
  title text,
  content text,
  model text,
  followup_delay_seconds integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ── pgvector + documents + match_documents ────────────────────
-- LangChain Supabase Vector Store schema. Used by the
-- Knowledgebase_tool node (retrieve-as-tool, topK=40) with
-- OpenAI text-embedding-3-small (1536 dims).
create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

create index if not exists idx_documents_embedding
  on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Standard LangChain match_documents RPC. The vectorStoreSupabase
-- node calls this with (query_embedding, match_count, filter).
create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql as $$
#variable_conflict use_column
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;


-- ── voice_prompts ─────────────────────────────────────────────
-- One row per Voice-Setter slot per client. Written by the
-- save-external-prompt edge function when the dashboard's
-- Save Setter button is clicked for a Voice-Setter-N card. The
-- Retell agent itself is synced separately via retell-proxy, so
-- this table is mainly an archival mirror + source for future
-- text/voice cross-sync.
--
-- card_name format mirrors text_prompts: 'Setter-1', 'Setter-2', etc.
-- (the edge function strips the 'Voice-Setter-' prefix before save).
create table if not exists voice_prompts (
  id uuid primary key default gen_random_uuid(),
  card_name text not null unique,
  system_prompt text,
  booking_prompt text,
  booking_function_enabled boolean default false,
  model text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ── Seed: prompts positional slots ────────────────────────────
-- Fill rows 0..10 so the workflow's data[10] reference resolves.
-- Row 10 holds the active Setter-1 followup prompt; rows 0-9 are
-- placeholders you can repurpose for other slots.
insert into prompts (id, title, content, model, followup_delay_seconds)
values
  (0,  'slot-0',  '', 'google/gemini-2.5-pro', 0),
  (1,  'slot-1',  '', 'google/gemini-2.5-pro', 0),
  (2,  'slot-2',  '', 'google/gemini-2.5-pro', 0),
  (3,  'slot-3',  '', 'google/gemini-2.5-pro', 0),
  (4,  'slot-4',  '', 'google/gemini-2.5-pro', 0),
  (5,  'slot-5',  '', 'google/gemini-2.5-pro', 0),
  (6,  'slot-6',  '', 'google/gemini-2.5-pro', 0),
  (7,  'slot-7',  '', 'google/gemini-2.5-pro', 0),
  (8,  'slot-8',  '', 'google/gemini-2.5-pro', 0),
  (9,  'slot-9',  '', 'google/gemini-2.5-pro', 0),
  (10, 'Setter-1 Followup',
       'Write a short, casual followup nudge. 1-2 sentences. No pressure.',
       'google/gemini-2.5-pro', 1440)
on conflict (id) do nothing;
