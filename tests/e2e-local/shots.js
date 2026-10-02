// Headless screenshots against a LOCAL build (next start :3055) wired to a LOCAL Supabase stub (:54400).
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const OUT = process.env.OUT || __dirname + '/../../docs/qa-2026-10-02-post54';
const B = 'http://localhost:3055';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const rec = (k, v) => { results.push({ k, v }); console.log(k, JSON.stringify(v)); };
const SESSION = () => { const now = Math.floor(Date.now() / 1000); return JSON.stringify({ access_token: 'good-local-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'local-refresh',
  user: { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'a.contractor@example.test', user_metadata: { first_run_done: true }, app_metadata: {}, created_at: '2026-09-01T00:00:00Z' } }); };
(async () => {
  const b = await chromium.launch();
  for (const w of [375, 768, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 }, isMobile: w < 768, hasTouch: w < 768 });
    const page = await ctx.newPage(); const errs = []; const bad = [];
    page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
    page.on('response', r => r.status() >= 400 && !r.url().includes(':54400') && bad.push(r.status() + ' ' + r.url().split('?')[0]));
    await page.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(800);
    await page.locator('button:has-text("See Live Demo")').first().click(); await sleep(1200);
    const nav = l => w < 768 ? `.sw-bn .sw-bi:has(.sw-lb:text-is("${l}"))` : `.sw-sd .sw-sl:has-text("${l}")`;
    await page.locator(nav('Jobs')).first().click(); await sleep(800);
    const vis = await page.evaluate(() => [...document.querySelectorAll('.sw-jm,.sw-jd')].filter(e => e.offsetParent !== null).length);
    rec(`demo jobs visible rows @${w}`, vis);
    await page.screenshot({ path: `${OUT}/demo-jobs-${w}.png`, fullPage: true });
    // + New Job in demo -> account prompt
    await page.locator('main button:has-text("+ New Job"), button:has-text("+ New Job")').first().click(); await sleep(500);
    rec(`demo +New Job opens prompt @${w}`, await page.locator('#sw-demo-gate-title').count());
    if (w === 1280 || w === 375) await page.screenshot({ path: `${OUT}/demo-newjob-prompt-${w}.png` });
    await page.locator('text=Keep exploring the demo').click(); await sleep(300);
    // Clients + Add in demo -> account prompt
    await page.locator(nav('Clients')).first().click(); await sleep(500);
    await page.locator('button:has-text("+ Add")').first().click(); await sleep(400);
    rec(`demo Clients +Add opens prompt @${w}`, await page.locator('#sw-demo-gate-title').count());
    await page.locator('text=Keep exploring the demo').click(); await sleep(300);
    if (w < 768) {
      // Alerts tab must be clickable (chat bubble no longer covers it)
      let ok = true; try { await page.locator(nav('Alerts')).first().click({ timeout: 3000 }); } catch (e) { ok = false; }
      rec('mobile Alerts tab clickable', ok);
      const geo = await page.evaluate(() => { const c = document.querySelector('.sw-chat').getBoundingClientRect(); const n = document.querySelector('.sw-bn').getBoundingClientRect(); return { chatBottom: Math.round(c.bottom), navTop: Math.round(n.top) }; });
      rec('mobile chat bubble above tab bar', geo);
      await page.screenshot({ path: `${OUT}/demo-mobile-alerts-chat-${w}.png` });
    }
    // Logged-out chat: local canned reply, no /api/chat call
    let chatCalls = 0; page.on('request', r => r.url().includes('/api/chat') && chatCalls++);
    await page.locator('button[aria-label="Open assistant"]').click(); await sleep(300);
    await page.locator('input[placeholder="Ask about jobs, pricing..."]').fill('How should I price a bathroom remodel?');
    await page.keyboard.press('Enter'); await sleep(600);
    rec(`demo chat local reply @${w}`, { apiChatCalls: chatCalls, reply: (await page.locator('text=full AI assistant').count()) > 0 });
    if (w === 1280) await page.screenshot({ path: `${OUT}/demo-chat-local-reply-1280.png` });
    rec(`console errors @${w}`, errs); rec(`http>=400 (app origin) @${w}`, bad);
    await ctx.close();
  }
  // Signed-in (local stub session) at 1280 and 375: desktop rows + delete with confirm
  for (const w of [1280, 375]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 }, isMobile: w < 768, hasTouch: w < 768 });
    await ctx.addInitScript(s => { localStorage.setItem('sb-127-auth-token', s); }, SESSION());
    const page = await ctx.newPage();
    await page.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1500);
    const nav = l => w < 768 ? `.sw-bn .sw-bi:has(.sw-lb:text-is("${l}"))` : `.sw-sd .sw-sl:has-text("${l}")`;
    const badge = await page.evaluate(() => document.querySelector('button[aria-label^="Notifications"]')?.getAttribute('aria-label'));
    rec(`signed-in bell badge @${w}`, badge);
    await page.locator(nav('Jobs')).first().click(); await sleep(700);
    const rows = await page.evaluate(() => [...document.querySelectorAll('.sw-jm,.sw-jd')].filter(e => e.offsetParent !== null).length);
    rec(`signed-in jobs visible rows @${w}`, rows);
    await page.screenshot({ path: `${OUT}/signedin-jobs-${w}.png`, fullPage: true });
    let dialogMsg = null; page.once('dialog', d => { dialogMsg = d.message(); d.accept(); });
    await page.locator(`button[aria-label="Delete job for ${w===1280?"Test Job Two":"Test Job Three"}"]:visible`).click(); await sleep(800);
    const after = await page.evaluate(() => [...document.querySelectorAll('.sw-jm,.sw-jd')].filter(e => e.offsetParent !== null).map(e => e.innerText.split('\n')[0]));
    rec(`signed-in delete @${w}`, { confirm: dialogMsg, rowsAfter: after, toast: await page.locator('text=Job deleted.').count() });
    await page.screenshot({ path: `${OUT}/signedin-jobs-after-delete-${w}.png`, fullPage: true });
    await ctx.close();
  }
  // Public estimate page
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
    const r = await page.goto(B + '/estimate/abcd1234abcd1234abcd1234abcd1234', { waitUntil: 'networkidle' });
    rec('estimate page status', r.status()); await page.screenshot({ path: `${OUT}/estimate-public-1280.png`, fullPage: true }); await ctx.close(); }
  fs.writeFileSync(OUT + '/results.json', JSON.stringify(results, null, 2));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
