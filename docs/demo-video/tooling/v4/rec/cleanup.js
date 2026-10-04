// Deletes ONLY the rows/files this v4 recording created (ids from counts-mid.json), via the smoke user's own RLS session.
// Keeps QA's Oct 2 storage files. The per-user invoice counter row is left as-is.
const { chromium } = require('playwright'); const { signIn, red } = require('./lib');
const mid = require('./counts-mid.json').detail;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage(); const s = await signIn(p);
  const log = [];
  const del = async (t, id) => { try { const r = await s.rest('DELETE', `${t}?id=eq.${id}&contractor_id=eq.${s.uid}`); log.push([t, id, 'deleted rows: ' + (r ? r.length : 0)]); } catch (e) { log.push([t, id, 'ERR ' + e.message]); } };
  for (const i of mid.invoices) await del('invoices', i.id);
  for (const t of ['estimates', 'jobs', 'receipts', 'portfolio', 'leads']) for (const r of mid[t]) await del(t, r.id);
  const files = require('./counts-mid.json').files.filter(f => f.includes('@2026-10-04')).map(f => `${s.uid}/${f.split(' @')[0]}`);
  const sr = await fetch(`${s.base}/storage/v1/object/stackedwork-images`, { method: 'DELETE', headers: { ...s.hdr, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: files }) });
  log.push(['storage', files.length + ' files', sr.status, (await sr.text()).slice(0, 300)]);
  console.log(JSON.stringify(log, null, 1)); await b.close();
})().catch(e => { console.error('ERR', red ? red(String(e.message)) : 'error'); process.exit(1); });
