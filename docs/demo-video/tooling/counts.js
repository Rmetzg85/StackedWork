// Counts the smoke account's own rows through its RLS session (the app's own anon key + the user's access token).
const { chromium } = require('playwright');
const SITE = 'https://www.letstaystacked.com', EMAIL = process.env.SW_SMOKE_EMAIL, PW = process.env.SW_SMOKE_PASSWORD;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  let hdr = null, base = null;
  p.on('request', r => { const u = r.url(); if (/\/rest\/v1\//.test(u) && !hdr) { const h = r.headers(); if (h.authorization && h.apikey && !h.authorization.includes(h.apikey)) { hdr = { apikey: h.apikey, authorization: h.authorization }; base = u.split('/rest/v1/')[0]; } } });
  await p.goto(`${SITE}/login?mode=signin`, { waitUntil: 'networkidle' });
  await p.locator('input[type="email"]').fill(EMAIL); await p.locator('input[type="password"]').fill(PW); await p.locator('button[type="submit"]').click();
  await p.waitForFunction(() => document.body.innerText.includes('Revenue Dashboard'), null, { timeout: 30000 }); await p.waitForTimeout(2500);
  if (!hdr) throw new Error('no user-authenticated REST request seen');
  const out = {};
  for (const t of ['jobs', 'estimates', 'receipts', 'portfolio']) {
    const r = await fetch(`${base}/rest/v1/${t}?select=id`, { headers: { ...hdr, Prefer: 'count=exact', Range: '0-0' } });
    out[t] = r.ok ? Number((r.headers.get('content-range') || '*/?').split('/')[1]) : `HTTP ${r.status}`;
  }
  // storage: the user's own folder in stackedwork-images
  const uid = JSON.parse(Buffer.from(hdr.authorization.split('.')[1], 'base64url').toString()).sub;
  const s = await fetch(`${base}/storage/v1/object/list/stackedwork-images`, { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: uid, limit: 1000 }) });
  out.storage_objects_in_own_folder = s.ok ? (await s.json()).length : `HTTP ${s.status}`;
  console.log(JSON.stringify({ at: new Date().toString(), ...out }));
  await b.close();
})().catch(e => { console.error('ERR', String(e.message).split(PW).join('[R]')); process.exit(1); });
