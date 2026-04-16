

The user wants the snapshot to include richer context: list of all active setters (text + voice with names/slot IDs) AND recent error logs from the `error_logs` table, since most issues stem from AI operations (modify with AI, copy setter, setter creation) hitting OpenRouter.

Plan stays the same as before, with the snapshot expanded.

## Support Request Popup — Final Plan

### UX
Standard `Dialog` (matches app style — groove border, white card, blurred overlay, VT323 title). Replaces the AI chatbot in `SupportChatWidget.tsx`.

Fields:
- Subject input
- "What's happening?" textarea
- Collapsible **Technical Snapshot** (auto-attached, read-only)

Three action buttons:
- **Copy snapshot** — clipboard, universal fallback
- **Send via Gmail** — `https://mail.google.com/mail/?view=cm&fs=1&to=...&su=...&body=...` in new tab
- **Send via Mail app** — `mailto:` link

### Snapshot contents
```text
=== USER REQUEST ===
{user's description}

---
=== ACCOUNT ===
Account email: eugene@quimple.agency
Account ID: 2f7fd34b-...
Sub-account: "Acme Roofing"
Client ID: 35f905a9-...
Current page: /client/.../chats
Browser: Chrome 131 / macOS
Time: 2026-04-16 21:45 ET

=== ACTIVE SETTERS ===
Text:
  - Setter-1: "Geno Default"
  - Setter-2: "Acme Booking Bot"
Voice:
  - Voice-1: "Katherine Outbound"
  - Voice-3: "Cimo Reactivation"

=== RECENT ERROR LOGS (last 10) ===
[2026-04-16 21:30] generate-ai-prompt — OpenRouter 429 rate limit
[2026-04-16 20:15] copy-setter-config — Missing booking_prompt
[...]
```

### Data sources (all queried live when dialog opens)
- Account: `useAuth().user`
- Sub-account: `clients` table by `clientId` from URL
- Active setters: `prompts` table where `client_id = X AND is_active = true AND category IN ('text_agent','voice_setter')` — return `slot_id` + `name` + `category`
- Error logs: `error_logs` table where `client_id = X` ORDER BY `created_at DESC` LIMIT 10 — fields: `created_at`, `source`/`function_name`, `message`
- Browser: `navigator.userAgent`

### Files to change
1. `src/components/SupportChatWidget.tsx` — strip chatbot logic (OpenRouter, messages, ReactMarkdown, `support_chat_messages` reads). Keep floating retro pixel button only; on click open the new dialog.
2. `src/components/SupportRequestDialog.tsx` (NEW) — built on existing `Dialog` primitives.
3. `src/lib/supportSnapshot.ts` (NEW) — pure helpers: `fetchSnapshotData(clientId, user)`, `formatSnapshot(data, subject, body)`, `buildMailto(...)`, `buildGmailUrl(...)`.

### Open question
Default destination email — confirm `support@1prompt.com` or give me the right address.

