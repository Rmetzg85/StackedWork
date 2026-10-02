// Follow-up checks (b, d, e, g, h) against LOCAL build :3055 + stub :54400 (+ Anthropic mock :54401).
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const OUT = process.env.OUT || __dirname + '/../../docs/qa-2026-10-02-post54';
const B = 'http://localhost:3055', S = 'http://127.0.0.1:54400';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const rec = (k, v) => { results.push({ k, v }); console.log(k, JSON.stringify(v)); };
const mode = q => fetch(`${S}/__mode?${q}`).then(r => r.json());
const SESSION = () => { const now = Math.floor(Date.now() / 1000); return JSON.stringify({ access_token: 'good-local-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'local-refresh',
  user: { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'a.contractor@example.test', user_metadata: { first_run_done: true }, app_metadata: {}, created_at: '2026-09-01T00:00:00Z' } }); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(s => { localStorage.setItem('sb-127-auth-token', s); }, SESSION());
  const page = await ctx.newPage();
  const nav = l => `.sw-sd .sw-sl:has-text("${l}")`;
  const load = async () => { await page.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1200); };
  // (g) bell
  await mode('allRead=1&unpriced=0'); await load();
  rec('(g) bell, all leads read', { aria: await page.getAttribute('button[aria-label^="Notifications"]', 'aria-label'), badgeText: await page.evaluate(() => document.querySelector('button[aria-label^="Notifications"] span')?.textContent ?? null) });
  await page.screenshot({ path: `${OUT}/bell-all-read-1280.png`, clip: { x: 780, y: 0, width: 500, height: 60 } });
  await mode('allRead=0'); await load();
  rec('(g) bell, 1 unread', await page.evaluate(() => document.querySelector('button[aria-label^="Notifications"] span')?.textContent ?? null));
  // (b) New Job form reset on close and on reopen after save
  const field = l => page.locator(`label:has-text("${l}") + input, label:has-text("${l}") ~ input`).first();
  const read = async () => ({ customer: await field('Customer Name').inputValue(), phone: await field('Phone').inputValue(), address: await field('Address').inputValue(), notes: await page.locator('textarea[placeholder="Job details..."]').inputValue() });
  const fill = async (n) => { await field('Customer Name').fill(`Reset Test ${n}`); await field('Phone').fill('(410) 555-0199'); await field('Address').fill('9 Test Ln'); await page.locator('textarea[placeholder="Job details..."]').fill('carry-over check'); };
  await page.locator(nav('Jobs')).click(); await sleep(400);
  await page.locator('button:has-text("+ New Job")').first().click(); await sleep(400);
  await fill(1); rec('(b) filled', await read());
  await page.locator('button[aria-label="Close"]').first().click(); await sleep(300);
  await page.locator('button:has-text("+ New Job")').first().click(); await sleep(400);
  rec('(b) reopened after close', await read());
  await fill(2);
  await page.locator('button:has-text("Save Job")').last().click(); await sleep(1200);
  rec('(b) saved toast', await page.locator('text=Job saved.').count());
  await page.locator('button:has-text("+ New Job")').first().click(); await sleep(400);
  rec('(b) reopened after save', await read());
  await page.screenshot({ path: `${OUT}/newjob-reopened-blank-1280.png` });
  await page.locator('button[aria-label="Close"]').first().click(); await sleep(300);
  // (h) Profit
  await mode('unpriced=1'); await load(); await page.locator(nav('Profit')).click(); await sleep(500);
  rec('(h) profit, jobs exist but none priced', (await page.locator('main').innerText()).slice(0, 260));
  await page.screenshot({ path: `${OUT}/profit-unpriced-1280.png` });
  await mode('unpriced=0'); await load(); await page.locator(nav('Profit')).click(); await sleep(500);
  rec('(h) profit, priced jobs', (await page.locator('main').innerText()).slice(0, 300));
  await page.screenshot({ path: `${OUT}/profit-priced-1280.png`, fullPage: true });
  // (e) Photo delete removes storage objects
  await page.locator(nav('Photos')).click(); await sleep(500);
  page.once('dialog', d => d.accept());
  await page.locator('button:has-text("Delete")').first().click(); await sleep(1000);
  rec('(e) storage objects removed', await fetch(`${S}/__storage_removed`).then(r => r.json()));
  rec('(e) toast', await page.locator('text=Photo deleted.').count());
  // (d) Estimate send without RESEND key
  await page.locator(nav('Estimates')).click(); await sleep(500);
  await page.locator('text=Test Estimate Customer').first().click(); await sleep(500);
  await page.locator('button:has-text("Send Email")').first().click(); await sleep(1200);
  const toast = await page.locator('[role="status"]').innerText().catch(() => '');
  rec('(d) send toast', toast);
  await page.screenshot({ path: `${OUT}/estimate-send-no-resend-1280.png` });
  fs.writeFileSync(OUT + '/results-followup.json', JSON.stringify(results, null, 2));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
