// Backfill leads on bfd-platform from chat_history sessions on bfd-setter-live.
// Includes only sessions that look like real GHL contact IDs or UUIDs;
// test/probe sessions (e.g. "test-*", "phase6test*", "curl-probe", "p5-...") are skipped.
//
// Idempotent: uses ON CONFLICT (client_id, lead_id) DO NOTHING.

import https from 'https';

const BFD_PLATFORM_REF = 'bjgrgbgykvjrsuwwruoh';
const BFD_PLATFORM_SR = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZ3JnYmd5a3ZqcnN1d3dydW9oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDY3OTM5NiwiZXhwIjoyMDYwMjU1Mzk2fQ.EuuDAKWIe2Yc4Wv3-XCHfXCOCzqMfIFkEZ3a1jM74T8';

const SETTER_LIVE_REF = 'qildpilxjodxdifggmto';
const SETTER_LIVE_SR = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbGRwaWx4am9keGRpZmdnbXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU4MjAxMywiZXhwIjoyMDkyMTU4MDEzfQ.FOWnbT6tql92CV4eQT-4KOFGxc799LqNkMS4uCGsbRc';

// Account-level PAT for Management API SQL endpoint
const MANAGEMENT_PAT = 'sbp_bda99a50f822c83489d7f0c24980b5f28306303e';

const CLIENT_ID = 'e467dabc-57ee-416c-8831-83ecd9c7c925';

const GHL_ID_RE = /^[a-zA-Z0-9]{20}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function postJson(host, path, key, body) {
  const data = JSON.stringify(body);
  const opts = {
    method: 'POST',
    host,
    path,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      apikey: key,
      'Content-Length': Buffer.byteLength(data),
      Prefer: 'resolution=ignore-duplicates,return=representation',
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${chunks}`));
        } else {
          try { resolve(JSON.parse(chunks)); } catch { resolve(chunks); }
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(host, path, key) {
  const opts = {
    method: 'GET',
    host,
    path,
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${chunks}`));
        } else {
          try { resolve(JSON.parse(chunks)); } catch { resolve(chunks); }
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runSql(ref, query) {
  return postJson(
    'api.supabase.com',
    `/v1/projects/${ref}/database/query`,
    MANAGEMENT_PAT,
    { query },
  );
}

function isRealSession(sessionId) {
  return GHL_ID_RE.test(sessionId) || UUID_RE.test(sessionId);
}

(async () => {
  console.log('Fetching distinct chat_history sessions from bfd-setter-live...');
  const sessionsResult = await runSql(
    SETTER_LIVE_REF,
    `SELECT
       session_id,
       MIN(timestamp)::text AS first_msg,
       MAX(timestamp)::text AS last_msg,
       (
         SELECT LEFT(REPLACE(REPLACE((message::jsonb->>'content'), E'\\n', ' '), E'\\r', ' '), 200)
         FROM chat_history c2
         WHERE c2.session_id = chat_history.session_id
         ORDER BY c2.timestamp DESC
         LIMIT 1
       ) AS last_preview
     FROM chat_history
     GROUP BY session_id
     ORDER BY MAX(timestamp) DESC;`,
  );

  console.log(`  → ${sessionsResult.length} total sessions`);
  const real = sessionsResult.filter((s) => isRealSession(s.session_id));
  const skipped = sessionsResult.length - real.length;
  console.log(`  → ${real.length} look like real contacts; ${skipped} probe/test sessions skipped`);

  console.log('Fetching existing leads on bfd-platform for client...');
  const existing = await runSql(
    BFD_PLATFORM_REF,
    `SELECT lead_id FROM leads WHERE client_id = '${CLIENT_ID}';`,
  );
  const existingIds = new Set(existing.map((r) => r.lead_id));
  console.log(`  → ${existingIds.size} existing leads`);

  const toInsert = real.filter((s) => !existingIds.has(s.session_id));
  console.log(`  → ${toInsert.length} leads to backfill`);

  if (toInsert.length === 0) {
    console.log('Nothing to backfill. Done.');
    return;
  }

  // Insert via Management API SQL (PostgREST keeps rejecting the JWT)
  const sqlEscape = (v) => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
  const valuesSql = toInsert.map((s) => {
    const preview = (s.last_preview || '').substring(0, 200);
    return `('${CLIENT_ID}', '${s.session_id.replace(/'/g, "''")}', ${sqlEscape(preview)}, '${s.last_msg}', false)`;
  }).join(',\n');

  const insertQ = `INSERT INTO leads (client_id, lead_id, last_message_preview, last_message_at, setter_stopped) VALUES\n${valuesSql}\nON CONFLICT (client_id, lead_id) DO NOTHING RETURNING lead_id;`;

  console.log(`Inserting ${toInsert.length} rows into bfd-platform.leads via Management API...`);
  const inserted = await runSql(BFD_PLATFORM_REF, insertQ);
  console.log(`  → ${Array.isArray(inserted) ? inserted.length : '?'} rows actually inserted`);
  if (Array.isArray(inserted)) {
    inserted.forEach((r) => console.log(`     • ${r.lead_id}`));
  }
  console.log('Backfill complete.');
})().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
