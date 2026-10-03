// LOCAL ONLY: mobile layout checks against a local build (:3090) + Supabase stub (:54400). No prod data.
// Usage: OUT=docs/mobile-2026-10-03/before TAG=before node tests/e2e-local/mobile-shots.js
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs'); const { execSync } = require('child_process');
const B = 'http://localhost:3090', OUT = process.env.OUT, TAG = process.env.TAG || 'x'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SESSION = () => { const now = Math.floor(Date.now() / 1000); return JSON.stringify({ access_token: 'good-local-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'local-refresh',
  user: { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'a.contractor@example.test', user_metadata: { first_run_done: true }, app_metadata: {}, created_at: '2026-09-01T00:00:00Z' } }); };
const res = [];
// Page-level and modal-level horizontal overflow (the editor overflowed inside the modal, not the page).
const measure = (p, sel, w) => p.evaluate(([sel, w]) => {
  const d = document.documentElement; const m = sel ? [...document.querySelectorAll(sel)].pop() : null;
  return { device: w, docScrollWidth: d.scrollWidth, innerWidth: window.innerWidth, pageOk: d.scrollWidth <= window.innerWidth && window.innerWidth <= w,
    ...(m ? { boxScrollWidth: m.scrollWidth, boxClientWidth: m.clientWidth, boxOk: m.scrollWidth <= m.clientWidth } : {}) };
}, [sel, w]);
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 375, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await ctx.addInitScript((s) => { localStorage.setItem('sb-127-auth-token', s); }, SESSION());
    const p = await ctx.newPage();
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1500);
    const nav = (l) => `.sw-bn .sw-bi:has(.sw-lb:text-is("${l}"))`;
    // 1) New Estimate -> Line Items
    await p.locator(nav('Estimates')).first().evaluate((e) => e.click()); await sleep(700);
    await p.locator('main button:has-text("+ New Estimate")').first().click(); await sleep(500);
    const m = 'div[style*="max-width: 560px"]';
    await p.locator(`${m} input[placeholder="John Smith"]`).fill('Mike Davis');
    await p.locator(`${m} button:has-text("Next: Line Items")`).click(); await sleep(400);
    await p.locator(`${m} input[placeholder="Description"]`).first().fill('Replace 50-gal water heater, haul away old unit');
    await p.locator(`${m} input[placeholder="$/unit"]`).first().fill('1850');
    await p.locator(`${m} button:has-text("+ Add Line Item")`).click(); await sleep(200);
    await p.locator(`${m} input[placeholder="Description"]`).nth(1).fill('Permit');
    await p.locator(`${m} input[placeholder="$/unit"]`).nth(1).fill('75');
    await p.evaluate(() => document.querySelectorAll('div').forEach((e) => { if (e.scrollLeft) e.scrollLeft = 0; }));
    res.push({ w, view: 'new-estimate line items', ...(await measure(p, m, w)) });
    await p.locator(m).last().screenshot({ path: `${OUT}/editor-new-${w}.png` });
    await p.locator(`${m} button:has-text("×")`).first().click(); await sleep(300);
    // 2) Edit estimate line items (estimate detail -> Edit)
    await p.locator('main div[style*="cursor: pointer"]').first().click(); await sleep(700);
    const edit = p.locator(`${m} button:has-text("Edit")`).last();
    if (await edit.count()) { await edit.click(); await sleep(500); res.push({ w, view: 'edit-estimate line items', ...(await measure(p, m, w)) }); await p.locator(m).last().screenshot({ path: `${OUT}/editor-edit-${w}.png` }); }
    else res.push({ w, view: 'edit-estimate', note: 'no Edit button found' });
    await p.keyboard.press('Escape'); await p.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1200);
    // 3) Voice review card (typed path -> same review card; the local fallback parser fills it without AI)
    await p.locator(nav('Jobs')).first().evaluate((e) => e.click()); await sleep(600);
    await p.locator('main button:has-text("+ New Job")').first().click(); await sleep(500);
    await p.locator('input[aria-label="Type the job instead of speaking"]').fill('Water heater replacement for Mike Davis at 42 Oak Street, Tuesday at 10am, $1850');
    await p.locator('button:has-text("Fill in")').click(); await sleep(2500);
    const card = p.getByText('Check these details before saving').first().locator('..');
    const whenRow = await card.innerText().catch(() => ''); res.push({ w, view: 'voice review card', when: (whenRow.match(/When\s*\n?\s*([^\n]+)/) || [])[1] || null });
    if (w === 390) await card.screenshot({ path: `${OUT}/review-card-${w}.png` });
    await p.close();
    // 4) Public estimate page
    const q = await ctx.newPage(); await q.goto(B + '/estimate/abcd1234abcd1234abcd1234abcd1234', { waitUntil: 'networkidle' }); await sleep(800);
    const totalBox = await q.evaluate(() => { const els = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /\$1500\.00/.test(e.textContent || '') && e.offsetParent !== null); return els.map((e) => { const r = e.getBoundingClientRect(); return Math.round(r.right); }); });
    res.push({ w, view: 'public estimate', ...(await measure(q, null, w)), amountRightEdges: totalBox, allAmountsVisible: totalBox.every((x) => x <= w) });
    await q.screenshot({ path: `${OUT}/public-${w}.png`, fullPage: true });
    if (w === 390) { await q.pdf({ path: `${OUT}/public-print.pdf`, format: 'Letter', printBackground: true }); try { execSync(`pdftoppm -png -r 60 -f 1 -l 1 ${OUT}/public-print.pdf ${OUT}/public-print`); fs.unlinkSync(`${OUT}/public-print.pdf`); } catch (e) { console.log('pdftoppm failed', e.message); } }
    await ctx.close();
  }
  fs.writeFileSync(`${OUT}/checks.json`, JSON.stringify(res, null, 1)); for (const r of res) console.log(TAG, JSON.stringify(r));
  await b.close();
})();
