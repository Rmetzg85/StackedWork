// LOCAL ONLY: invoicing v1 flow + mobile checks against a local build (:3090) + Supabase stub (:54400). No prod data.
// Usage: OUT=docs/invoicing-2026-10-03 PLAYWRIGHT=... node tests/e2e-local/invoice-shots.js
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs'); const { execSync } = require('child_process');
const B = 'http://localhost:3090', S = 'http://127.0.0.1:54400', OUT = process.env.OUT || 'docs/invoicing-2026-10-03'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SESSION = () => { const now = Math.floor(Date.now() / 1000); return JSON.stringify({ access_token: 'good-local-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'local-refresh',
  user: { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'a.contractor@example.test', user_metadata: { first_run_done: true }, app_metadata: {}, created_at: '2026-09-01T00:00:00Z' } }); };
const todayNY = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const plus = (d, n) => { const t = new Date(d + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const inv = async () => (await fetch(S + '/__invoices')).json();
const res = []; let fails = 0;
const check = (name, cond, extra) => { res.push({ check: name, ok: !!cond, ...(extra || {}) }); if (!cond) fails++; };
const measure = (p, sel, w) => p.evaluate(([sel, w]) => {
  const d = document.documentElement; const m = sel ? [...document.querySelectorAll(sel)].pop() : null;
  return { device: w, docScrollWidth: d.scrollWidth, innerWidth: window.innerWidth, pageOk: d.scrollWidth <= window.innerWidth && window.innerWidth <= w,
    ...(m ? { boxScrollWidth: m.scrollWidth, boxClientWidth: m.clientWidth, boxOk: m.scrollWidth <= m.clientWidth } : {}) };
}, [sel, w]);
(async () => {
  const b = await chromium.launch();
  for (const w of [320, 390, 1280]) {
    const mobile = w < 800;
    const ctx = await b.newContext(mobile ? { viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: w, height: 860 }, deviceScaleFactor: 1 });
    await ctx.addInitScript((s) => { localStorage.setItem('sb-127-auth-token', s); }, SESSION());
    const p = await ctx.newPage(); p.on('dialog', (d) => d.accept());
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1500);
    const navSel = mobile ? '.sw-bn .sw-bi:has(.sw-lb:text-is("Estimates"))' : '.sw-sd .sw-sl:has-text("Estimates")';
    await p.locator(navSel).first().evaluate((e) => e.click()); await sleep(700);
    // 1) Accepted estimate -> Create invoice
    await p.locator('main div[style*="cursor: pointer"]:has-text("Test Client Deck")').first().click(); await sleep(600);
    const em = 'div[style*="max-width: 560px"]';
    await p.locator('[data-testid="est-invoice-box"]').scrollIntoViewIfNeeded();
    if (w !== 320) await p.locator(em).last().screenshot({ path: `${OUT}/estimate-create-invoice-${w}.png` });
    const before = (await inv()).length;
    await p.locator('[data-testid="est-create-invoice"]').click(); await sleep(1200);
    const all = await inv(); const created = all.find((x) => x.customer_name === 'Test Client Deck');
    check(`${w}: created from estimate`, all.length === before + 1 && created, { number: created && created.invoice_number });
    check(`${w}: copied totals + items`, created && created.total === 5787.6 && created.subtotal === 5460 && created.tax_amount === 327.6 && created.tax_rate === 6 && created.line_items.length === 2 && created.customer_email === 'deck.client@example.test' && created.estimate_id === 'eeeeeeee-0000-4000-8000-000000000003');
    check(`${w}: Net 15 due date`, created && created.issue_date === todayNY() && created.due_date === plus(todayNY(), 15), { issue: created && created.issue_date, due: created && created.due_date });
    check(`${w}: numbered INV-0003`, created && created.invoice_number === 'INV-0003' && created.status === 'draft');
    const dlg = '[role="dialog"]';
    res.push({ w, view: 'invoice detail', ...(await measure(p, dlg, w)) });
    await p.locator(dlg).last().screenshot({ path: `${OUT}/invoice-detail-draft-${w}.png` });
    // 2) Edit: change due date, save
    await p.locator(`${dlg} button:has-text("Edit")`).click(); await sleep(500);
    res.push({ w, view: 'invoice editor', ...(await measure(p, '[data-testid="inv-editor"]', w)) });
    await p.locator('[data-testid="inv-editor"]').screenshot({ path: `${OUT}/invoice-editor-${w}.png` });
    await p.locator('input[aria-label="Due date"]').fill(plus(todayNY(), 30));
    await p.locator('[data-testid="inv-save"]').click(); await sleep(800);
    check(`${w}: due date editable`, (await inv()).find((x) => x.id === created.id).due_date === plus(todayNY(), 30));
    // 3) Mark paid
    await p.locator('[data-testid="inv-mark-paid"]').click(); await sleep(800);
    const paid = (await inv()).find((x) => x.id === created.id);
    check(`${w}: mark paid sets paid_at`, paid.status === 'paid' && !!paid.paid_at);
    check(`${w}: badge shows Paid`, (await p.locator(`${dlg} [data-testid="inv-badge"]`).last().innerText()) === 'Paid');
    if (w === 390) await p.locator(dlg).last().screenshot({ path: `${OUT}/invoice-detail-paid-${w}.png` });
    await p.locator(`${dlg} button[aria-label="Close"]`).click(); await sleep(400);
    // 4) List (with the overdue fixture)
    res.push({ w, view: 'invoices list', ...(await measure(p, null, w)) });
    const rows = await p.locator('[data-testid="inv-row"]').allInnerTexts();
    check(`${w}: list shows overdue fixture as Overdue`, rows.some((r) => /INV-0002/.test(r) && /Overdue/.test(r) && /days? overdue/.test(r)));
    await p.screenshot({ path: `${OUT}/invoices-list-${w}.png`, fullPage: !mobile });
    // 5) Delete the created invoice
    await p.locator('[data-testid="inv-row"]:has-text("INV-0003")').click(); await sleep(400);
    await p.locator(`${dlg} button:has-text("Delete")`).click(); await sleep(800);
    check(`${w}: delete`, !(await inv()).some((x) => x.id === created.id));
    // 6) New blank invoice editor (mobile overflow)
    await p.locator('main button:has-text("+ New Invoice")').click(); await sleep(400);
    await p.locator('input[aria-label="Customer name"]').fill('Test Blank Invoice Customer With A Long Name');
    await p.locator('[data-testid="inv-editor"] input[aria-label="Description"]').first().fill('Emergency service call, after hours, includes diagnosis');
    await p.locator('[data-testid="inv-editor"] input[aria-label="Price per unit"]').first().fill('1850');
    res.push({ w, view: 'new invoice editor', ...(await measure(p, '[data-testid="inv-editor"]', w)) });
    check(`${w}: editor Net 15 default`, (await p.locator('input[aria-label="Due date"]').inputValue()) === plus(todayNY(), 15));
    if (w === 320) await p.locator('[data-testid="inv-editor"]').screenshot({ path: `${OUT}/invoice-editor-new-${w}.png` });
    await p.locator('button[aria-label="Close editor"]').click();
    await p.close();
    // 7) Public invoice page (overdue fixture) + print
    const q = await ctx.newPage(); await q.goto(B + '/invoice/inv0overdue00000000000000000000002', { waitUntil: 'networkidle' }); await sleep(800);
    const edges = await q.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /\$354\.04/.test(e.textContent || '') && e.offsetParent !== null).map((e) => Math.round(e.getBoundingClientRect().right)));
    res.push({ w, view: 'public invoice', ...(await measure(q, null, w)), amountRightEdges: edges, allAmountsVisible: edges.length > 0 && edges.every((x) => x <= w) });
    check(`${w}: public page no Pay now`, !/pay now/i.test(await q.content()));
    await q.screenshot({ path: `${OUT}/public-invoice-${w}.png`, fullPage: true });
    if (w === 390) { await q.pdf({ path: `${OUT}/public-print.pdf`, format: 'Letter', printBackground: true }); try { execSync(`pdftoppm -png -r 60 -f 1 -l 1 ${OUT}/public-print.pdf ${OUT}/public-invoice-print`); fs.unlinkSync(`${OUT}/public-print.pdf`); } catch (e) { console.log('pdftoppm failed', e.message); } }
    if (w === 390) { await q.goto(B + '/invoice/inv0paid0000000000000000000000001', { waitUntil: 'networkidle' }); await sleep(500); res.push({ w, view: 'public invoice (paid)', ...(await measure(q, null, w)) }); await q.screenshot({ path: `${OUT}/public-invoice-paid-${w}.png`, fullPage: true }); }
    await ctx.close();
  }
  // 8) Before the migration is applied: no error toast, "almost ready" card.
  await fetch(S + '/__mode?invoicesMissing=1');
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => { localStorage.setItem('sb-127-auth-token', s); }, SESSION());
  const p = await ctx.newPage(); await p.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1500);
  await p.locator('.sw-bn .sw-bi:has(.sw-lb:text-is("Estimates"))').first().evaluate((e) => e.click()); await sleep(500);
  await p.locator('[data-testid="sec-invoices"]').click(); await sleep(400);
  check('pre-migration: shows almost-ready card, no error toast', (await p.getByText('Invoicing is almost ready').count()) === 1 && (await p.getByText("Couldn't load invoices").count()) === 0);
  await p.screenshot({ path: `${OUT}/pre-migration-390.png` });
  await fetch(S + '/__mode?invoicesMissing=0');
  await b.close();
  const widths = res.filter((r) => r.view); const wfail = widths.filter((r) => r.pageOk === false || r.boxOk === false || r.allAmountsVisible === false);
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 0).replace(/\},\{/g, '},\n{'));
  console.log(`checks: ${res.filter((r) => r.check).length - fails}/${res.filter((r) => r.check).length} pass; width checks: ${widths.length - wfail.length}/${widths.length} pass`);
  process.exit(fails || wfail.length ? 1 : 0);
})();
