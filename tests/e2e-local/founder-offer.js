// LOCAL ONLY: staged founder offer against local builds + mock Stripe (:54404). No live Stripe.
// Run twice: BASE=http://localhost:3093 CASE=off (built/started WITHOUT STRIPE_FOUNDER_COUPON_ID), and CASE=on (with it).
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const B = process.env.BASE || 'http://localhost:3093', OUT = process.env.OUT || '/tmp/founder', CASE = process.env.CASE || 'off'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const M = 'http://127.0.0.1:54404';
const res = [];
let first = true;
async function scenario(name, mode) {
  if (!first) await sleep(61000); // /api/founder-spots caches the count for 60 s
  first = false;
  await fetch(`${M}/__mode?${mode}`);
  const spots = await (await fetch(`${B}/api/founder-spots`)).json();
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 })).newPage();
  await p.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1200);
  const hero = await p.evaluate(() => { const sec = document.querySelector('section'); return sec ? sec.innerText.split('\n').filter(Boolean).slice(0, 8) : []; });
  await p.screenshot({ path: `${OUT}/${CASE}-${name}-home.png` });
  await p.goto(B + '/login', { waitUntil: 'networkidle' }); await sleep(800);
  const loginSub = await p.locator('h1 + p').first().innerText();
  await b.close();
  const co = await fetch(`${B}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'new.contractor@example.test', utm: {} }) });
  const coBody = await co.json();
  const sess = (await (await fetch(`${M}/__sessions`)).json()).pop() || {};
  res.push({ case: CASE, scenario: name, founderSpots: spots, heroLines: hero, loginSub, checkoutStatus: co.status, checkoutUrl: coBody.url,
    session: { trial_period_days: sess['subscription_data[trial_period_days]'], discount_coupon: sess['discounts[0][coupon]'] || null, allow_promotion_codes: sess['allow_promotion_codes'] || null, offer_meta: sess['subscription_data[metadata][offer]'] || null, success_url: sess.success_url, missing_pm: sess['subscription_data[trial_settings][end_behavior][missing_payment_method]'] } });
}
(async () => {
  if (CASE === 'off') await scenario('env-unset', 'founders=0&redeemed=0');
  else {
    await scenario('3-taken', 'founders=3&redeemed=3');
    await scenario('coupon-cap-hit', 'founders=12&redeemed=20');
    await scenario('20-taken', 'founders=20&redeemed=20');
  }
  fs.writeFileSync(`${OUT}/results-${CASE}.json`, JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
