// LOCAL ONLY: ?play=1 opens the demo modal; ?trade= is captured as first touch and sent with the (mocked) signup.
// Needs a local build on :3092 (NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54400). Supabase signup, /api/notify-signup and
// /api/checkout are intercepted in the browser, so nothing leaves the machine. Usage: OUT=dir node tests/e2e-local/play-trade.js
const { chromium, webkit } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const B = 'http://localhost:3092', OUT = process.env.OUT || '/tmp/play-trade'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const res = [];
async function playCase(name, engine, launchArgs, ctxOpts) {
  const b = await engine.launch(launchArgs); const ctx = await b.newContext(ctxOpts); const p = await ctx.newPage();
  await p.goto(B + '/?utm_source=email&play=1&trade=HVAC&utm_campaign=founder#top', { waitUntil: 'load' }); await sleep(2500);
  const st = await p.evaluate(() => { const v = document.querySelector('[role=dialog] video'); return {
    modalOpen: !!document.querySelector('[role=dialog]'), url: location.pathname + location.search + location.hash,
    videoPaused: v ? v.paused : null, videoMuted: v ? v.muted : null, currentTime: v ? +v.currentTime.toFixed(2) : null,
    tapButton: !!document.querySelector('button[aria-label="Play the demo with sound"]'), firstTouch: localStorage.getItem('sw_first_touch') }; });
  await p.screenshot({ path: `${OUT}/${name}.png` });
  const r = { case: name, ...st };
  if (st.tapButton) { await p.locator('button[aria-label="Play the demo with sound"]').click(); await sleep(1200);
    Object.assign(r, await p.evaluate(() => { const v = document.querySelector('[role=dialog] video'); return { afterTap_paused: v.paused, afterTap_muted: v.muted, afterTap_time: +v.currentTime.toFixed(2), afterTap_button: !!document.querySelector('button[aria-label="Play the demo with sound"]') }; })); }
  await p.reload({ waitUntil: 'load' }); await sleep(1500);
  r.afterRefresh_modalOpen = await p.evaluate(() => !!document.querySelector('[role=dialog]'));
  res.push(r); await b.close();
}
(async () => {
  await playCase('desktop-autoplay-allowed', chromium, { args: ['--autoplay-policy=no-user-gesture-required'] }, { viewport: { width: 1280, height: 800 } });
  await playCase('desktop-autoplay-blocked', chromium, { args: ['--autoplay-policy=document-user-activation-required'] }, { viewport: { width: 1280, height: 800 } });
  await playCase('iphone-webkit', webkit, {}, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });

  // Mocked signup: the click lands with ?trade=hvac, then the visitor signs up later from /login.
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const seen = {};
  await p.route('**/auth/v1/signup**', async (route) => { seen.signup = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: '33333333-3333-4333-8333-333333333333', aud: 'authenticated', role: 'authenticated', email: seen.signup.email, user_metadata: seen.signup.data, app_metadata: {}, identities: [], created_at: '2026-10-03T00:00:00Z' }) }); });
  await p.route('**/api/notify-signup', async (route) => { seen.notify = JSON.parse(route.request().postData() || '{}'); await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await p.route('**/api/checkout', async (route) => { seen.checkout = JSON.parse(route.request().postData() || '{}'); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: B + '/welcome?mock=1' }) }); });
  await p.goto(B + '/?trade=hvac', { waitUntil: 'load' }); await sleep(1000);
  const stored = await p.evaluate(() => localStorage.getItem('sw_first_touch'));
  await p.goto(B + '/login', { waitUntil: 'load' }); await sleep(800);
  await p.locator('input[type="email"]').fill('new.contractor@example.test');
  await p.locator('input[type="password"]').first().fill('local-only-Passw0rd!');
  await p.locator('button[type="submit"]').click(); await sleep(4500);
  res.push({ case: 'mocked signup after ?trade=hvac', storedAfterClick: stored,
    signup_user_metadata: seen.signup && seen.signup.data, notify_body_trade: seen.notify && seen.notify.first_touch_trade,
    checkout_body_utm: seen.checkout && seen.checkout.utm, finalUrl: p.url().replace(B, '') });
  await b.close();
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
