// Deletes every job and estimate on the smoke account through the app's own Delete buttons (RLS session).
const { chromium } = require('playwright');
const SITE = 'https://www.letstaystacked.com', EMAIL = process.env.SW_SMOKE_EMAIL, PW = process.env.SW_SMOKE_PASSWORD;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
  p.on('dialog', d => d.accept()); const dels = [];
  p.on('response', r => { if (r.request().method() === 'DELETE' && /rest\/v1\/(jobs|estimates)/.test(r.url())) dels.push(`${r.url().match(/v1\/(\w+)/)[1]} ${r.status()}`); });
  await p.goto(`${SITE}/login?mode=signin`, { waitUntil: 'networkidle' });
  await p.locator('input[type="email"]').fill(EMAIL); await p.locator('input[type="password"]').fill(PW); await p.locator('button[type="submit"]').click();
  await p.waitForFunction(() => document.body.innerText.includes('Revenue Dashboard'), null, { timeout: 30000 }); await sleep(2000);
  await p.locator('.sw-sd .sw-sl:has-text("Jobs")').click(); await sleep(1500);
  for (let k = 0; k < 20; k++) { const btn = p.locator('main button[aria-label^="Delete job"]:visible').first(); if (!(await btn.count())) break; await btn.click(); await sleep(2200); }
  await p.locator('.sw-sd .sw-sl:has-text("Estimates")').click(); await sleep(1500);
  for (let k = 0; k < 20; k++) {
    const row = p.locator('main div[style*="cursor: pointer"]:has-text("Mike Davis")').first(); if (!(await row.count())) break;
    await row.click(); await sleep(900); await p.locator('div[style*="max-width: 560px"] button:has-text("Delete")').last().click(); await sleep(2500);
  }
  console.log('DELETE responses:', JSON.stringify(dels)); await b.close();
})().catch(e => { console.error('ERR', String(e.message).split(PW).join('[R]')); process.exit(1); });
