// Records the real production app (signed in as the QA smoke account) with a CDP screencast.
// Password comes from env only and is never printed. Creates 1 job + 1 estimate; cleanup.js deletes them.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const SITE = 'https://www.letstaystacked.com', EMAIL = process.env.SW_SMOKE_EMAIL, PW = process.env.SW_SMOKE_PASSWORD;
const TAKE = process.env.TAKE || 'take1', OUT = `${__dirname}/${TAKE}`;
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(`${OUT}/frames`, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const red = s => String(s).split(PW || '\u0000').join('[REDACTED]').replace(/eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g, '[JWT]');
const events = []; let t0 = null; const mark = (name) => { const t = Date.now() / 1000; events.push({ name, t }); console.log('MARK', name); };
(async () => {
  if (!PW) throw new Error('SW_SMOKE_PASSWORD missing');
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['microphone'] });
  await ctx.grantPermissions(['microphone', 'clipboard-read', 'clipboard-write'], { origin: SITE });
  const p = await ctx.newPage();
  const net = [];
  p.on('dialog', d => d.accept());
  p.on('response', async r => { const u = r.url(); if (/\/api\/parse-job|rest\/v1\/(jobs|estimates)/.test(u) && r.request().method() !== 'GET') net.push({ u: u.split('?')[0].replace(/^https:\/\/[^/]+/, ''), m: r.request().method(), s: r.status(), b: red(await r.text().catch(() => '')).replace(/"share_token":"[0-9a-f-]+"/g, '"share_token":"<tok>"').slice(0, 600) }); });
  await p.goto(`${SITE}/login?mode=signin`, { waitUntil: 'networkidle' });
  await p.locator('input[type="email"]').fill(EMAIL); await p.locator('input[type="password"]').fill(PW); await p.locator('button[type="submit"]').click();
  await p.waitForFunction(() => document.body.innerText.includes('Revenue Dashboard'), null, { timeout: 30000 }); await sleep(2500);

  // Screencast
  // High-res capture loop (CDP screenshots at 2x, ~25-30 fps). Screencast only gives CSS-pixel frames.
  const cdp = await ctx.newCDPSession(p); let n = 0, rec = true; const frames = [];
  const loop = (async () => { while (rec) { try { const m = await cdp.send('Page.getLayoutMetrics'); const v = m.cssVisualViewport; const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 86, optimizeForSpeed: true, clip: { x: v.pageX, y: v.pageY, width: 390, height: 844, scale: 2 } }); const i = n++; frames.push({ i, t: Date.now() / 1000 }); fs.writeFileSync(`${OUT}/frames/${String(i).padStart(5, '0')}.jpg`, Buffer.from(r.data, 'base64')); } catch { await sleep(30); } } })();
  mark('start'); await sleep(1500);

  // 1) Jobs → New Job → Voice Entry (real Web Speech; the TTS phrase plays into a virtual PulseAudio mic)
  await p.locator('button:has-text("🔨"), div:has-text("🔨 Jobs")').filter({ hasText: 'Jobs' }).last().click(); await sleep(1200);
  mark('jobs');
  await p.locator('main button:has-text("+ New Job")').first().click(); await sleep(900);
  mark('newjob');
  await p.locator('button:has-text("Voice Entry")').click(); mark('voice_start');
  await sleep(500); const play = spawn('paplay', ['-d', 'vsink', `${__dirname}/phrase.wav`]);
  await new Promise(r => play.on('exit', r)); mark('voice_spoken');
  await p.waitForFunction(() => /Confirm & Save Job/.test(document.body.innerText) && !/Reading your job details/.test(document.body.innerText), null, { timeout: 30000 });
  mark('parsed');
  const modal = p.locator('div:has(> h2:text-matches("New Job|Log your first job"))').locator('xpath=ancestor::div[contains(@style,"max-width")][1]').first();
  const heard = await p.locator('text=Heard:').locator('xpath=..').innerText({ timeout: 1500 }).catch(() => '');
  const review = await p.locator('div[style*="EFF6FF"]').first().innerText({ timeout: 1500 }).catch(() => '');
  fs.writeFileSync(`${OUT}/parse.json`, JSON.stringify({ heard, review }, null, 2)); console.log('HEARD', heard, '\nREVIEW', review.replace(/\s+/g, ' '));
  await sleep(2200);
  // scroll the form to show the filled fields, then save
  await p.mouse.wheel(0, 500); await sleep(1600); await p.mouse.wheel(0, 700); await sleep(1200);
  mark('save_click'); await p.locator('button:has-text("Confirm & Save Job")').click();
  await p.waitForFunction(() => !/Confirm & Save Job/.test(document.body.innerText), null, { timeout: 20000 }); await sleep(1800);
  mark('job_saved');

  // 2) Estimate for the same customer
  await p.locator('button:has-text("📋"), div:has-text("📋 Estimates")').filter({ hasText: 'Estimates' }).last().click(); await sleep(1200);
  mark('estimates');
  await p.locator('main button:has-text("+ New Estimate"), main button:has-text("Create First Estimate")').first().click(); await sleep(800);
  mark('newest');
  const em = p.locator('div[style*="max-width: 560px"]').first();
  await em.locator('input[placeholder="John Smith"]').pressSequentially('Mike Davis', { delay: 35 });
  const phone = em.locator('input[type="tel"], input[placeholder*="555"]').first(); if (await phone.count()) await phone.pressSequentially('(410) 555-0142', { delay: 25 });
  const sel = em.locator('select').first(); const opts = await sel.locator('option').allInnerTexts(); const want = opts.find(o => /plumb/i.test(o)) || opts[0]; await sel.selectOption({ label: want });
  await sleep(500); await em.locator('button:has-text("Next: Line Items")').click(); await sleep(700);
  mark('lineitems');
  await em.locator('input[placeholder="Description"]').first().pressSequentially('Replace 50-gal water heater', { delay: 30 });
  const qty = em.locator('input[placeholder="Qty"]').first(); await qty.fill('1');
  const unit = em.locator('select').first(); const uo = await unit.locator('option').allInnerTexts(); if (uo.includes('each')) await unit.selectOption('each');
  const up = em.locator('input[placeholder="$/unit"]').first(); await up.fill(''); await up.pressSequentially('1850', { delay: 60 });
  // The line-item row is wider than a 390px phone and the modal scrolls sideways while typing; scroll back like a user would.
  await sleep(500); await p.evaluate(() => document.querySelectorAll('div').forEach(e => { if (e.scrollLeft > 0) e.scrollTo({ left: 0, behavior: 'smooth' }); }));
  await sleep(1400); mark('est_save_click');
  await em.locator('button:has-text("Save Draft")').click(); await sleep(3000);
  mark('est_saved');
  await p.locator('main div[style*="cursor: pointer"]:has-text("Mike Davis")').first().click(); await sleep(1500);
  mark('est_detail');
  const det = p.locator('div[style*="max-width: 560px"]').last();
  await det.locator('button:has-text("Share Link")').scrollIntoViewIfNeeded(); await sleep(1200);
  const popupP = p.waitForEvent('popup', { timeout: 10000 });
  mark('share_click'); await det.locator('button:has-text("Share Link")').click();
  const pop = await popupP; await pop.waitForLoadState('domcontentloaded').catch(() => {}); const pubUrl = pop.url(); await pop.close();
  await sleep(600);
  // 3) Public estimate page (what the customer opens from the link)
  mark('public_nav'); await p.goto(pubUrl, { waitUntil: 'networkidle' }); await sleep(2200);
  mark('public_loaded'); await p.mouse.wheel(0, 450); await sleep(2000); await p.mouse.wheel(0, 600); await sleep(2200);
  mark('end');
  rec = false; await loop;
  fs.writeFileSync(`${OUT}/frames.json`, JSON.stringify(frames)); fs.writeFileSync(`${OUT}/events.json`, JSON.stringify(events));
  fs.writeFileSync(`${OUT}/net.json`, JSON.stringify(net, null, 2));
  console.log('frames', frames.length, 'public page path', new URL(pubUrl).pathname.replace(/[0-9a-f-]{20,}/, '<token>'));
  await b.close();
})().catch(e => { console.error('ERR', red(e.stack || e.message)); process.exit(1); });
