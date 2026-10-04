// LOCAL ONLY: 30-day no-card trial check against a local build + mock Stripe (:54404) + stub Supabase (:54400).
// Founder env (STRIPE_FOUNDER_COUPON_ID) must be UNSET. Run from /workspace/demo-rec with NODE_PATH set.
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const B = process.env.BASE || 'http://localhost:3093', OUT = process.env.OUT || '/tmp/trial30', TAG = process.env.TAG || 'en';
const M = 'http://127.0.0.1:54404';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BAD = /\b14[- ]?(day|d[ií]a)|14 D[IÍ]AS|catorce|fourteen|29\.99|\b60[- ]day|60 days|60 d[ií]as|founding contractors|founder pricing/i;
(async () => {
  const out = { tag: TAG, pages: {} };
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const pages = TAG === 'es' ? [['home', '/']] : [['home', '/'], ['signup', '/login?mode=signup'], ['terms', '/terms'], ['marketing-plan', '/marketing-plan'], ['welcome-founder-param', '/welcome?offer=founder']];
  for (const [name, path] of pages) {
    await p.goto(B + path, { waitUntil: 'networkidle' }); await sleep(1200);
    const text = await p.evaluate(() => document.body.innerText);
    const hits = (text.match(/.{0,50}(\d+[- ]?(day|DAY|días|DÍAS)|tarjeta|TARJETA|credit card|CREDIT CARD).{0,40}/g) || []).map((s) => s.trim());
    const bad = text.match(new RegExp('.{0,40}' + BAD.source + '.{0,20}', 'gi'));
    out.pages[name] = { trialMentions: [...new Set(hits)], forbidden: bad || [] };
    if (name !== 'welcome-founder-param') await p.screenshot({ path: `${OUT}/${TAG}-${name}.png`, fullPage: name !== 'home' && name !== 'marketing-plan' });
    if (name === 'home') {
      for (const [sel, n] of [['text=/Start free today|Empieza gratis hoy/', 'signup-section'], ['text=/Start Your Free Trial|Inicia tu prueba gratis/', 'cta']]) {
        const l = p.locator(sel).first(); if (await l.count()) { await l.scrollIntoViewIfNeeded(); await sleep(400); await p.screenshot({ path: `${OUT}/${TAG}-home-${n}.png` }); }
      }
    }
  }
  if (TAG === 'en') {
    const co = await fetch(`${B}/api/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'new.contractor@example.test', utm: {} }) });
    const sess = (await (await fetch(`${M}/__sessions`)).json()).pop() || {};
    out.checkout = { status: co.status, trial_period_days: sess['subscription_data[trial_period_days]'], payment_method_collection: sess['payment_method_collection'], missing_payment_method: sess['subscription_data[trial_settings][end_behavior][missing_payment_method]'], allow_promotion_codes: sess['allow_promotion_codes'] || null, discount_coupon: sess['discounts[0][coupon]'] || null, payment_method_types: sess['payment_method_types[0]'] };
    out.founderSpots = await (await fetch(`${B}/api/founder-spots`)).json();
  }
  await b.close();
  fs.writeFileSync(`${OUT}/results-${TAG}.json`, JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
