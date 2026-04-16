# Setup Overview

This is the map — not the directions. Each step below involves multiple sub-steps that require reading the documentation for the relevant service.

---

## Prerequisites

- GoHighLevel account with sub-account access
- Supabase account (you will create two projects: one for the platform, one per client)
- Trigger.dev account
- n8n instance (cloud or self-hosted)
- OpenRouter account with API key
- Lovable account (for the frontend dashboard)
- Node.js 18+ installed locally

---

## Steps

### 1. Platform Supabase Project

Create a new Supabase project. This is your main platform database — not the client's.

Run `supabase/schema.sql` in the Supabase SQL Editor. This creates all required tables.

### 2. Supabase Edge Functions

The Edge Functions are the webhook API layer. They are not in this repo — they live in Lovable. You will deploy them from there.

Key Edge Functions:
- `receive-dm-webhook` — receives incoming GHL messages, triggers Trigger.dev
- Various functions for AI job management and client configuration

### 3. Trigger.dev Project

Create a new Trigger.dev project. Copy your project ID into `trigger.config.ts`.

Set environment variables in your Trigger.dev dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Clone this repo locally, install dependencies (`npm install`), then deploy:

```bash
npx trigger.dev@latest deploy
```

### 4. GoHighLevel Snapshot

Import the GHL snapshot into your sub-account. This sets up the pipeline, workflows, and webhook triggers.

The snapshot link is shared separately in the course resources.

### 5. n8n Workflows

Import the n8n workflow JSON files (shared separately in course resources) into your n8n instance.

Configure the following credentials in n8n:
- OpenRouter API key
- Supabase credentials (client's project, not the platform project)
- Any other credentials referenced in the workflows

### 6. Lovable Frontend

Connect the Lovable project to your Supabase platform database. The dashboard reads from and writes to the tables created in Step 1.

### 7. Client Configuration

Add your first client row to the `clients` table in Supabase. This row must include:
- `ghl_location_id` — the GHL sub-account location ID
- `text_engine_webhook` — your n8n webhook URL for the text engine
- `ghl_send_setter_reply_webhook_url` — the GHL webhook that sends the AI reply to the lead
- `openrouter_api_key` — the client's OpenRouter key
- `llm_model` — the model to use (e.g. `google/gemini-2.5-pro`)
- `supabase_url` and `supabase_service_key` — credentials for the client's own Supabase project

### 8. GHL Webhook Configuration

In GoHighLevel, configure the automation triggers to fire the `receive-dm-webhook` Edge Function URL when a contact sends a message.

The webhook must include these parameters: `Contact_ID`, `GHL_Account_ID`, `Message_Body`, `Name`, `Email`, `Phone`, `Setter_Number`.

### 9. Agent Settings

Add a row to the `agent_settings` table for each setter slot (`Setter-1`, `Setter-2`, etc.) with the desired debounce delay and follow-up configuration.

### 10. End-to-End Test

Send a test message through GHL as a lead. Watch the `dm_executions` table update in real time. Verify the reply is sent back to GHL and the lead receives it.

---

## What Most People Get Stuck On

- Wiring the GHL webhook parameters in exactly the right format
- Configuring n8n to read query parameters (not JSON body) from Trigger.dev
- Getting the client's Supabase project structured correctly for n8n to read chat history
- Connecting all five services with the correct credentials in the right places

If you get stuck, that's normal. The fully managed setup is available at **[1prompt.io](https://1prompt.io)**.
