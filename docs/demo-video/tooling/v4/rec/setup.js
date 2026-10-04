// Creates the fictional demo data on prod as the smoke account (RLS session / the app's own UI). cleanup.js removes it.
const { chromium } = require('playwright'); const fs = require('fs');
const { SITE, signIn, red } = require('./lib');
const A = '/workspace/demo-rec/v4/assets'; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.on('dialog', (d) => d.accept());
  const s = await signIn(p); const out = { uid_prefix: s.uid.slice(0, 8) };
  // 1) Two finished jobs (same row shape as the app's New Job form)
  const jobs = await s.rest('POST', 'jobs', [
    { contractor_id: s.uid, customer: 'Dana Whitfield', phone: '(410) 555-0163', type: 'Deck', value: 2400, status: 'complete', date: '2026-09-24', notes: 'Address: 18 Linden Ave', hours_worked: 16, material_cost: 780 },
    { contractor_id: s.uid, customer: 'Luis Ortega', phone: '(443) 555-0118', type: 'Plumbing', value: 380, status: 'complete', date: '2026-09-29', notes: null, hours_worked: 3, material_cost: 95 },
  ]);
  out.jobs = jobs.map((j) => j.id);
  // 2) Accepted estimate for Mike Davis (same shape as handleSaveEstimate; then accepted like the Mark Accepted button)
  const items = [{ description: 'Replace 50-gal water heater', quantity: 1, unit: 'job', unit_price: 1850, total: 1850 }, { description: 'Permit + haul-away of old unit', quantity: 1, unit: 'job', unit_price: 75, total: 75 }];
  const [est] = await s.rest('POST', 'estimates', { contractor_id: s.uid, customer_name: 'Mike Davis', customer_email: 'mike.davis@example.com', customer_phone: '(410) 555-0142', job_type: 'Plumbing', line_items: items, subtotal: 1925, tax_rate: 6, tax_amount: 115.5, total: 2040.5, notes: 'Includes haul-away of the old unit.', status: 'draft', valid_until: '2026-10-31' });
  await s.rest('PATCH', `estimates?id=eq.${est.id}&contractor_id=eq.${s.uid}`, { status: 'accepted' });
  out.estimate = est.id;
  // 3) Receipt via the app's upload form (no AI scan)
  await p.locator('.sw-sd .sw-sl:has-text("Receipts")').click(); await sleep(1200);
  await p.locator('main button:has-text("+ Upload")').click(); await sleep(600);
  await p.locator('input[type="file"][accept*="pdf"]').setInputFiles(`${A}/receipt.png`); await sleep(800);
  const card = p.locator('main h2:has-text("Upload Receipt")').locator('..');
  await card.locator('input[type="number"]').fill('214.46'); await card.locator('input[type="date"]').fill('2026-10-02');
  await card.locator('select').selectOption('Materials'); await card.locator('input[placeholder^="e.g."]').fill('Deck lumber & fasteners');
  await card.locator('button:has-text("Save Receipt")').click(); await sleep(4000);
  // 4) Before/after photos via the app's Photos form
  await p.locator('.sw-sd .sw-sl:has-text("Photos")').click(); await sleep(1200);
  await p.locator('main button:has-text("+ Add Photos")').click(); await sleep(600);
  const fi = p.locator('main input[type="file"][accept="image/*"]');
  await fi.nth(0).setInputFiles(`${A}/before.jpg`); await sleep(600); await fi.nth(1).setInputFiles(`${A}/after.jpg`); await sleep(800);
  await p.locator('main div:text-is("🚿 Bath")').click();
  await p.locator('main input[placeholder^="Bathroom gut remodel"]').fill('Hall bath remodel, Towson MD');
  await p.locator('main button:has-text("Save Photos")').click(); await sleep(6000);
  // 5) A lead through the public lead form (signed-out visitor)
  const v = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
  await v.goto(`${SITE}/l/${s.uid}`, { waitUntil: 'networkidle' }); await sleep(4000);
  await v.locator('input[placeholder="Jane Smith"]').fill('Priya Raman'); await v.locator('input[type="tel"]').fill('(410) 555-0177');
  await v.locator('input[type="email"]').fill('priya.raman@example.com');
  await v.locator('div:text-is("Deck")').first().click().catch(() => {});
  await v.locator('textarea').fill('Looking to re-stain our deck, about 300 sq ft. Free most weekday evenings.');
  await sleep(1500); await v.locator('button:has-text("Send"), button:has-text("Submit")').first().click(); await sleep(4000);
  out.lead_page_text = (await v.locator('body').innerText()).slice(0, 200);
  // Verify
  for (const t of ['jobs', 'estimates', 'receipts', 'portfolio', 'leads', 'invoices']) out['n_' + t] = (await s.rest('GET', `${t}?select=id&contractor_id=eq.${s.uid}`)).length;
  fs.writeFileSync(__dirname + '/setup.json', JSON.stringify(out, null, 1)); console.log(red(JSON.stringify(out, null, 1)));
  await b.close();
})().catch((e) => { console.error('ERR', red(e.stack || e.message)); process.exit(1); });
