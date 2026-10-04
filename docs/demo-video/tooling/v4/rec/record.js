// v4 footage: real production app, signed in as the QA smoke account, 390x844 @2x, CDP screenshot capture.
// Uses the fictional data from setup.js. Creates: 1 job (voice entry) + 1 invoice (from the accepted estimate). cleanup.js removes all.
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const fs = require('fs');
const { SITE, signIn, red } = require('./lib');
const OUT = `${__dirname}/take`; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(`${OUT}/frames`, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const events = []; const mark = (name) => { events.push({ name, t: Date.now() / 1000 }); console.log('MARK', name); };
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-fake-ui-for-media-stream'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['microphone'] });
  await ctx.grantPermissions(['microphone', 'clipboard-read', 'clipboard-write'], { origin: SITE });
  const p = await ctx.newPage(); p.on('dialog', (d) => d.accept());
  const s = await signIn(p);
  const tab = async (l) => { await p.locator(`.sw-bn .sw-bi:has(.sw-lb:text-is("${l}"))`).first().evaluate((e) => e.click()); };
  await tab('Jobs'); await sleep(1500);
  const cdp = await ctx.newCDPSession(p); let n = 0, rec = true; const frames = [];
  const loop = (async () => { while (rec) { try { const m = await cdp.send('Page.getLayoutMetrics'); const v = m.cssVisualViewport; const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 86, optimizeForSpeed: true, clip: { x: v.pageX, y: v.pageY, width: 390, height: 844, scale: 2 } }); const i = n++; frames.push({ i, t: Date.now() / 1000 }); fs.writeFileSync(`${OUT}/frames/${String(i).padStart(5, '0')}.jpg`, Buffer.from(r.data, 'base64')); } catch { await sleep(30); } } })();
  mark('start'); await sleep(1200); mark('jobs'); await sleep(1800);
  // 1) Voice entry
  await p.locator('main button:has-text("+ New Job")').first().click(); mark('newjob'); await sleep(1000);
  await p.locator('button:has-text("Voice Entry")').click(); mark('voice_start');
  await sleep(500); const play = spawn('paplay', ['-d', 'vsink', '/workspace/demo-rec/phrase.wav']); await new Promise((r) => play.on('exit', r)); mark('voice_spoken');
  await p.waitForFunction(() => /Confirm & Save Job/.test(document.body.innerText) && !/Reading your job details/.test(document.body.innerText), null, { timeout: 30000 }); mark('parsed');
  const review = await p.locator('div[style*="EFF6FF"]').first().innerText({ timeout: 1500 }).catch(() => '');
  const heard = await p.locator('text=Heard:').locator('xpath=..').innerText({ timeout: 1500 }).catch(() => '');
  await sleep(2000); await p.mouse.move(195, 500); await p.mouse.wheel(0, 500); await sleep(1400); await p.mouse.wheel(0, 700); await sleep(1000);
  mark('save_click'); await p.locator('button:has-text("Confirm & Save Job")').click();
  await p.waitForFunction(() => !/Confirm & Save Job/.test(document.body.innerText), null, { timeout: 20000 }); await sleep(1600); mark('job_saved'); await sleep(1200);
  // 2) Profit
  await tab('Profit'); mark('profit'); await sleep(1600); await p.mouse.wheel(0, 260); await sleep(1300); mark('profit_end');
  // 3) Estimate detail (accepted)
  await tab('Estimates'); mark('estimates'); await sleep(900);
  await p.locator('main div[style*="cursor: pointer"]:has-text("Mike Davis")').first().click(); mark('est_detail'); await sleep(1600);
  await p.mouse.move(195, 500); await p.mouse.wheel(0, 260); await sleep(1300); mark('est_detail_end');
  await p.locator('div[style*="max-width: 560px"] button:has-text("×")').last().click().catch(() => {}); await sleep(500);
  // 4) Leads (the lead from the public form, unread; bell badge)
  await tab('Leads'); mark('leads'); await sleep(2600); mark('leads_end');
  // 5) Receipts
  await tab('Receipts'); mark('receipts'); await sleep(2600); mark('receipts_end');
  // 6) Invoice from the accepted estimate
  await tab('Estimates'); await sleep(700);
  await p.locator('main div[style*="cursor: pointer"]:has-text("Mike Davis")').first().click(); mark('est2'); await sleep(900);
  await p.locator('[data-testid="est-invoice-box"]').evaluate((e) => e.scrollIntoView({ behavior: 'smooth', block: 'center' })); await sleep(1500);
  mark('create_click'); await p.locator('[data-testid="est-create-invoice"]').click();
  await p.waitForFunction(() => /INV-\d{4}/.test(document.querySelector('[role="dialog"]')?.innerText || ''), null, { timeout: 15000 }); mark('inv_detail');
  const invText = await p.locator('[role="dialog"]').last().innerText(); await sleep(2800);
  mark('copy_click'); await p.locator('[role="dialog"] button:has-text("Copy Link")').click(); await sleep(1800); mark('inv_sent');
  const [pop] = await Promise.all([ctx.waitForEvent('page'), p.locator('[role="dialog"] button:has-text("Preview")').click()]);
  await pop.waitForLoadState('domcontentloaded').catch(() => {}); const pubUrl = pop.url(); await pop.close(); await sleep(300);
  await p.locator('[role="dialog"] button[aria-label="Close"]').click(); await sleep(600); mark('inv_list'); await sleep(1600); mark('inv_list_end');
  // 7) Photos
  await tab('Photos'); mark('photos'); await sleep(2600); mark('photos_end');
  // 8) Home
  await tab('Home'); mark('home'); await sleep(2400); mark('home_end');
  // 9) Public invoice page (what the customer opens)
  await p.goto(pubUrl, { waitUntil: 'networkidle' }); await sleep(400); mark('pub_inv'); await sleep(1800);
  await p.mouse.move(195, 500); await p.mouse.wheel(0, 420); await sleep(1600); await p.mouse.wheel(0, 500); await sleep(1600); mark('pub_inv_end');
  // 10) The lead form customers fill in
  await p.goto(`${SITE}/l/${s.uid}`, { waitUntil: 'networkidle' }); await sleep(400); mark('leadform'); await sleep(2400); mark('leadform_end');
  mark('end'); rec = false; await loop;
  fs.writeFileSync(`${OUT}/frames.json`, JSON.stringify(frames)); fs.writeFileSync(`${OUT}/events.json`, JSON.stringify(events));
  fs.writeFileSync(`${OUT}/info.json`, JSON.stringify({ heard, review, invText, pubPath: new URL(pubUrl).pathname.replace(/[0-9a-f]{32}/, '<token>') }, null, 1));
  console.log('frames', frames.length, red(JSON.stringify({ heard, invText: invText.slice(0, 300) })));
  await b.close();
})().catch((e) => { console.error('ERR', red(e.stack || e.message)); process.exit(1); });
