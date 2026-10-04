// Shared helpers: sign in as the smoke account (password from env only, never printed) and capture its RLS REST headers.
const SITE = 'https://www.letstaystacked.com', EMAIL = 'sw.smoke+sep10@remventures.tech', PW = process.env.SW_SMOKE_PASSWORD;
const red = (s) => String(s).split(PW || '\u0000').join('[REDACTED]').replace(/eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g, '[JWT]');
async function signIn(p) {
  if (!PW) throw new Error('SW_SMOKE_PASSWORD missing');
  const cap = { hdr: null, base: null };
  p.on('request', (r) => { const u = r.url(); if (/\/rest\/v1\//.test(u) && !cap.hdr) { const h = r.headers(); if (h.authorization && h.apikey && !h.authorization.includes(h.apikey)) { cap.hdr = { apikey: h.apikey, authorization: h.authorization }; cap.base = u.split('/rest/v1/')[0]; } } });
  await p.goto(`${SITE}/login?mode=signin`, { waitUntil: 'networkidle' });
  await p.locator('input[type="email"]').fill(EMAIL); await p.locator('input[type="password"]').fill(PW); await p.locator('button[type="submit"]').click();
  await p.waitForFunction(() => document.body.innerText.includes('Revenue Dashboard'), null, { timeout: 30000 }); await p.waitForTimeout(2500);
  if (!cap.hdr) throw new Error('no user-authenticated REST request seen');
  cap.uid = JSON.parse(Buffer.from(cap.hdr.authorization.split('.')[1], 'base64url').toString()).sub;
  cap.rest = async (method, path, body) => {
    const r = await fetch(`${cap.base}/rest/v1/${path}`, { method, headers: { ...cap.hdr, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${red(t).slice(0, 300)}`); return t ? JSON.parse(t) : null;
  };
  return cap;
}
module.exports = { SITE, signIn, red };
