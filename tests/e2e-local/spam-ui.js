// LOCAL ONLY: honeypot UI checks against the local build (:3080) + Supabase stub (:54400).
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const B = 'http://localhost:3080', UID = '11111111-1111-4111-8111-111111111111';
const inserts = async () => (await (await fetch('http://127.0.0.1:54400/__inserts')).json()).filter((x) => x.t === 'leads').length;
(async () => {
  const b = await chromium.launch();
  // 1) Lead form
  let p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(`${B}/l/${UID}`, { waitUntil: 'networkidle' });
  const hp = p.locator('input[name="contact_me_by_fax_only"]');
  const box = await hp.boundingBox(); const tab = await hp.getAttribute('tabindex'); const hidden = await hp.evaluate((e) => e.closest('[aria-hidden="true"]') !== null);
  console.log('lead form honeypot: exists=', await hp.count(), 'x=', box && Math.round(box.x), 'tabindex=', tab, 'aria-hidden ancestor=', hidden, 'autocomplete=', await hp.getAttribute('autocomplete'));
  // keyboard: Tab through the form never lands on it
  let landed = false; for (let i = 0; i < 25; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => document.activeElement?.getAttribute('name') === 'contact_me_by_fax_only')) landed = true; }
  console.log('  Tab ever focuses honeypot:', landed);
  const fill = async () => { await p.locator('input[placeholder="Jane Smith"]').fill('Local UI Lead'); await p.locator('input[type="tel"]').fill('(410) 555-0177'); };
  let n0 = await inserts(); await fill(); await p.locator('button:has-text("Send request")').click(); await p.waitForTimeout(1500);
  console.log('  real submit -> success screen:', /thank|sent|got it|success/i.test(await p.locator('body').innerText()), '| new lead rows:', (await inserts()) - n0);
  await p.goto(`${B}/l/${UID}`, { waitUntil: 'networkidle' }); await fill(); await p.locator('input[name="contact_me_by_fax_only"]').fill('bot', { force: true });
  n0 = await inserts(); await p.locator('button:has-text("Send request")').click(); await p.waitForTimeout(1500);
  console.log('  bot submit (honeypot filled) -> success screen:', /thank|sent|got it|success/i.test(await p.locator('body').innerText()), '| new lead rows:', (await inserts()) - n0);
  await p.close();
  // 2) Signup form
  p = await b.newPage({ viewport: { width: 390, height: 844 } }); const authCalls = [];
  p.on('request', (r) => { if (/\/auth\/v1\/signup|\/api\/notify-signup|\/api\/checkout/.test(r.url())) authCalls.push(r.url().replace(/^https?:\/\/[^/]+/, '')); });
  await p.goto(`${B}/login?mode=signup`, { waitUntil: 'networkidle' });
  console.log('signup honeypot: exists=', await p.locator('input[name="contact_me_by_fax_only"]').count());
  await p.locator('input[type="email"]').fill('bot.signup@example.test'); await p.locator('input[type="password"]').fill('LocalOnly-not-a-real-pw-1');
  await p.locator('input[name="contact_me_by_fax_only"]').fill('bot', { force: true });
  await p.locator('button[type="submit"]').click(); await p.waitForTimeout(1500);
  console.log('  bot signup -> message:', JSON.stringify((await p.locator('body').innerText()).match(/Check your email[^\n]*/)?.[0] || null), '| signup/notify/checkout requests:', JSON.stringify(authCalls));
  // 3) Human signup (honeypot empty) still goes through: Supabase signUp (stub), then notify-signup + checkout.
  authCalls.length = 0; await p.goto(`${B}/login?mode=signup`, { waitUntil: 'networkidle' });
  await p.locator('input[type="email"]').fill('human.signup@example.test'); await p.locator('input[type="password"]').fill('LocalOnly-not-a-real-pw-1');
  await p.locator('button[type="submit"]').click(); await p.waitForTimeout(2500);
  console.log('human signup (honeypot empty) -> requests:', JSON.stringify([...new Set(authCalls.map((u) => u.split('?')[0]))]));
  await b.close();
})();
