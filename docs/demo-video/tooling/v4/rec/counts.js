// READ-ONLY: counts the smoke account's own rows via its RLS session (app anon key + user token). No writes.
const { chromium } = require('playwright');
const SITE = 'https://www.letstaystacked.com', EMAIL = process.env.SW_SMOKE_EMAIL, PW = process.env.SW_SMOKE_PASSWORD;
if (!EMAIL || !PW) { console.error('Set SW_SMOKE_EMAIL and SW_SMOKE_PASSWORD'); process.exit(1); }
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  let hdr = null, base = null;
  p.on('request', r => { const u = r.url(); if (/\/rest\/v1\//.test(u) && !hdr) { const h = r.headers(); if (h.authorization && h.apikey && !h.authorization.includes(h.apikey)) { hdr = { apikey: h.apikey, authorization: h.authorization }; base = u.split('/rest/v1/')[0]; } } });
  await p.goto(`${SITE}/login?mode=signin`, { waitUntil: 'networkidle' });
  await p.locator('input[type="email"]').fill(EMAIL); await p.locator('input[type="password"]').fill(PW); await p.locator('button[type="submit"]').click();
  await p.waitForFunction(() => document.body.innerText.includes('Revenue Dashboard'), null, { timeout: 30000 }); await p.waitForTimeout(2500);
  if (!hdr) throw new Error('no user-authenticated REST request seen');
  const uid = JSON.parse(Buffer.from(hdr.authorization.split('.')[1], 'base64url').toString()).sub;
  const out = {}; const detail = {};
  const sel = { jobs: 'id,customer,status,value,created_at', estimates: 'id,customer_name,status,total,created_at', invoices: 'id,invoice_number,customer_name,status,created_at', receipts: 'id,created_at', portfolio: 'id,caption,job_type,created_at', leads: 'id,name,created_at' };
  for (const t of Object.keys(sel)) {
    const r = await fetch(`${base}/rest/v1/${t}?select=${sel[t]}&contractor_id=eq.${uid}`, { headers: hdr });
    const j = r.ok ? await r.json() : null; out[t] = j ? j.length : `HTTP ${r.status}`; if (j) detail[t] = j;
  }
  const r = await fetch(`${base}/rest/v1/contractor_invoice_counters?select=*`, { headers: hdr }); out.counters_readable_by_user = r.status;
  const ls = async (prefix) => { const s = await fetch(`${base}/storage/v1/object/list/stackedwork-images`, { method: 'POST', headers: { ...hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix, limit: 1000 }) }); return s.ok ? await s.json() : []; };
  const files = []; for (const it of await ls(uid + '/')) { if (it.id) files.push(it.name); else for (const f of await ls(`${uid}/${it.name}/`)) files.push(`${it.name}/${f.name}` + (f.created_at ? ` @${f.created_at}` : '')); }
  out.storage_files = files.length;
  console.log(JSON.stringify({ at: new Date().toString(), counts: out, files, detail }, null, 1));
  await b.close();
})().catch(e => { console.error('ERR', String(e.message).split(PW).join('[R]')); process.exit(1); });
