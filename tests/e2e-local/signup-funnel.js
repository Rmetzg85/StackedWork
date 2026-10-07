// LOCAL ONLY: signup form behaviour against a local build (Supabase auth + checkout intercepted per scenario).
// Run: BASE=http://localhost:3095 OUT=docs/signup-audit-2026-10-07 node tests/e2e-local/signup-funnel.js  (playwright-core + system Chrome)
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright-core');
const fs = require('fs');
const B = process.env.BASE || 'http://localhost:3095', OUT = process.env.OUT || '/tmp/signup-funnel';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const iphone = { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1' };
const user = (identities) => ({ id: '00000000-0000-0000-0000-000000000001', email: 'new@example.test', identities, user_metadata: {} });
async function run(b, name, { signup, checkout, bot = false, resend = false }) {
  const ctx = await b.newContext(iphone); const p = await ctx.newPage();
  const calls = { signup: 0, notify: [], checkout: 0, resend: 0, events: [] };
  await p.route('**/auth/v1/signup**', (r) => { calls.signup++; return r.fulfill(signup); });
  await p.route('**/auth/v1/resend**', (r) => { calls.resend++; return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  await p.route('**/api/notify-signup', (r) => { calls.notify.push(JSON.parse(r.request().postData() || '{}').contact_me_by_fax_only); return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await p.route('**/api/checkout', (r) => { calls.checkout++; return r.fulfill(checkout || { status: 200, contentType: 'application/json', body: JSON.stringify({ url: B + '/terms?fake-stripe-checkout=1' }) }); });
  await p.goto(B + '/login?mode=signup', { waitUntil: 'networkidle' });
  if (bot) {
    await p.evaluate(() => {
      const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
      set(document.querySelector('input[name=contact_me_by_fax_only]'), 'http://spam.example'); set(document.querySelector('input[type=email]'), 'bot@example.test'); set(document.querySelector('input[type=password]'), 'secret123');
    });
    await p.evaluate(() => document.querySelector('form').requestSubmit());
  } else {
    if (name === 'autofilled-honeypot-human') await p.evaluate(() => { const el = document.querySelector('input[name=contact_me_by_fax_only]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'autofill'); el.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.locator('input[type=email]').click(); await p.keyboard.type('new@example.test');
    await p.locator('input[type=password]').click(); await p.keyboard.type('secret123');
    await p.locator('form button[type=submit]').click();
  }
  await sleep(1500);
  const box = await p.evaluate(() => [...document.querySelectorAll('form div')].map((d) => d.innerText).filter((t) => /email|account|limit|connection|created/i.test(t)).slice(-1)[0] || null);
  const h1 = await p.locator('h1').first().innerText();
  const ev1 = await p.evaluate(() => (window.dataLayer || []).filter((a) => a && a[0] === 'event').map((a) => a[1] + (a[2] && a[2].code ? ':' + a[2].code : ''))).catch(() => []);
  if (resend) { const r = p.locator('button:has-text("resend it"), button:has-text("Resend confirmation email")').first(); if (await r.count()) { await r.click(); await sleep(800); } }
  const after = resend ? await p.evaluate(() => [...document.querySelectorAll('form div')].map((d) => d.innerText).filter((t) => /Sent again/.test(t)).slice(-1)[0] || null) : null;
  await p.screenshot({ path: `${OUT}/local-${name}.png` });
  await sleep(1800);
  calls.events = await p.evaluate(() => (window.dataLayer || []).filter((a) => a && a[0] === 'event').map((a) => a[1] + (a[2] && a[2].code ? ':' + a[2].code : '')));
  if (!calls.events || !calls.events.length || p.url().includes('fake-stripe')) calls.events = ev1;
  const res = { name, h1, message: box, afterResend: after, finalUrl: p.url().replace(B, ''), ...calls };
  await ctx.close(); return res;
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' });
  const ok = (body) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  const out = [];
  out.push(await run(b, 'success', { signup: ok(user([{ id: 'i1' }])), resend: false }));
  out.push(await run(b, 'success-resend', { signup: ok(user([{ id: 'i1' }])), checkout: { status: 500, contentType: 'application/json', body: '{"error":"x"}' }, resend: true }));
  out.push(await run(b, 'existing-account', { signup: ok(user([])) }));
  out.push(await run(b, 'email-rate-limit', { signup: { status: 429, contentType: 'application/json', body: JSON.stringify({ code: 'over_email_send_rate_limit', error_code: 'over_email_send_rate_limit', msg: 'Email rate limit exceeded' }) } }));
  out.push(await run(b, 'already-registered', { signup: { status: 422, contentType: 'application/json', body: JSON.stringify({ code: 'user_already_exists', error_code: 'user_already_exists', msg: 'User already registered' }) } }));
  out.push(await run(b, 'bot-honeypot', { signup: ok(user([{ id: 'i1' }])), bot: true }));
  out.push(await run(b, 'autofilled-honeypot-human', { signup: ok(user([{ id: 'i1' }])) }));
  // demo modal CTA on the founder link
  const ctx = await b.newContext(iphone); const p = await ctx.newPage();
  await p.goto(B + '/?play=1&utm_campaign=founder', { waitUntil: 'domcontentloaded' }); await sleep(3000);
  const cta = await p.locator('[data-testid=demo-modal-cta]').innerText().catch(() => null);
  await p.screenshot({ path: `${OUT}/local-demo-modal-cta.png` });
  await p.locator('button[aria-label="Close video"]').click(); await sleep(600);
  const scrollY = await p.evaluate(() => scrollY);
  const heroCta = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => /Start Free Trial/.test(e.innerText)); const r = b.getBoundingClientRect(); return { top: Math.round(r.top), visible: r.top >= 0 && r.bottom <= innerHeight }; });
  await p.screenshot({ path: `${OUT}/local-after-modal-close.png` });
  out.push({ name: 'demo-modal', modalCta: cta, scrollYAfterClose: scrollY, heroStartFreeTrial: heroCta });
  await p.goto(B + '/login?mode=signup', { waitUntil: 'networkidle' }); await sleep(500); await p.screenshot({ path: `${OUT}/local-login-signup.png` });
  await p.goto(B + '/login?mode=signin', { waitUntil: 'networkidle' }); await sleep(500); out.push({ name: 'signin-param', h1: await p.locator('h1').first().innerText() });
  await ctx.close(); await b.close();
  fs.writeFileSync(`${OUT}/results-local.json`, JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
