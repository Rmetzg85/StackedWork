// LOCAL ONLY: voice-entry fallbacks under UA emulation against a local build (:3090) + Supabase stub (:54400)
// + Anthropic mock (:54401). No prod data. Usage: OUT=docs/voice-inapp-2026-10-03 node tests/e2e-local/voice-inapp.js
// QA's harness (/workspace/qa/voice-browsers/vb.js) is hard-wired to prod, so this mirrors its targets locally.
const { chromium, webkit } = require(process.env.PLAYWRIGHT || 'playwright');
const fs = require('fs');
const B = 'http://localhost:3090', OUT = process.env.OUT || '/tmp/voice-inapp'; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SESSION = () => { const now = Math.floor(Date.now() / 1000); return JSON.stringify({ access_token: 'good-local-token', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'local-refresh',
  user: { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'a.contractor@example.test', user_metadata: { first_run_done: true }, app_metadata: {}, created_at: '2026-09-01T00:00:00Z' } }); };
const UA = {
  igIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0.0 (iPhone15,2; iOS 17_5; en_US; en; scale=3.00; 1179x2556; 600000000)',
  igAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.0.0 Android',
  fbIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.0;FBBV/1;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/5]',
  fbAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]',
  iosChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.0.0 Mobile/15E148 Safari/604.1',
  firefoxDesktop: 'Mozilla/5.0 (X11; Linux x86_64; rv:155.0) Gecko/20100101 Firefox/155.0',
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
};
// sr: 'present' (a stub that would fire `err`), 'absent' (no SpeechRecognition, like Android WebView).
const TARGETS = {
  'ig-ios': { engine: webkit, ua: UA.igIos, sr: 'present', err: 'service-not-allowed' },
  'ig-android': { engine: chromium, ua: UA.igAndroid, sr: 'absent' },
  'fb-ios': { engine: webkit, ua: UA.fbIos, sr: 'present', err: 'service-not-allowed' },
  'fb-android': { engine: chromium, ua: UA.fbAndroid, sr: 'absent' },
  'ios-chrome': { engine: webkit, ua: UA.iosChrome, sr: 'present', err: 'service-not-allowed' },
  'android-chrome-no-speech': { engine: chromium, ua: UA.androidChrome, sr: 'present', err: 'no-speech' },
  'android-chrome-empty-result': { engine: chromium, ua: UA.androidChrome, sr: 'present', err: 'empty' },
  'android-chrome-no-mic': { engine: chromium, ua: UA.androidChrome, sr: 'present', err: 'audio-capture' },
  'android-chrome-network': { engine: chromium, ua: UA.androidChrome, sr: 'present', err: 'network' },
  'android-chrome-mic-blocked': { engine: chromium, ua: UA.androidChrome, sr: 'present', err: 'not-allowed' },
  'ios-safari-no-speech': { engine: webkit, ua: UA.iosSafari, sr: 'present', err: 'no-speech' },
  'firefox-desktop': { engine: chromium, ua: UA.firefoxDesktop, sr: 'absent', desktop: true },
};
const res = [];
(async () => {
  for (const [name, t] of Object.entries(TARGETS)) {
    const b = await t.engine.launch();
    const ctx = await b.newContext({ userAgent: t.ua, viewport: t.desktop ? { width: 1280, height: 800 } : { width: 390, height: 844 }, isMobile: t.engine !== webkit && !t.desktop ? true : undefined, hasTouch: true, deviceScaleFactor: 2 });
    await ctx.addInitScript(([s, sr, err]) => {
      localStorage.setItem('sb-127-auth-token', s);
      window.__srStarts = 0;
      if (sr === 'absent') { try { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; } catch {} window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; return; }
      class FakeSR { start() { window.__srStarts++; setTimeout(() => { if (err !== 'empty' && this.onerror) this.onerror({ error: err }); this.onend && this.onend(); }, 50); } stop() {} abort() {} }
      window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
    }, [SESSION(), t.sr, t.err]);
    const p = await ctx.newPage();
    await p.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1200);
    await p.locator('.sw-bn .sw-bi:has(.sw-lb:text-is("Jobs"))').first().evaluate((e) => e.click()); await sleep(500);
    await p.locator('main button:has-text("+ New Job")').first().click(); await sleep(400);
    await p.locator('button:has-text("Voice Entry")').click(); await sleep(400);
    const alert = await p.locator('[role="alert"]').first().textContent().catch(() => null);
    const focus = await p.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    const starts = await p.evaluate(() => window.__srStarts);
    const modal = p.locator('div[style*="max-width: 440px"]').last();
    await modal.screenshot({ path: `${OUT}/${name}.png` });
    res.push({ target: name, ua: t.ua.slice(0, 60) + '…', speechRecognition: t.sr, recognitionStarts: starts, alert, focused: focus });
    await b.close();
  }
  // AI parser guard: QA's typed phrase on a Saturday, with the mock replaying prod's bad answer (Roofing + today).
  await fetch('http://127.0.0.1:54401/__mode?m=gutter');
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
  await ctx.addInitScript((s) => localStorage.setItem('sb-127-auth-token', s), SESSION());
  const p = await ctx.newPage(); await p.goto(B + '/', { waitUntil: 'networkidle' }); await sleep(1200);
  const api = await p.evaluate(async () => { const r = await fetch('/api/parse-job', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer good-local-token' }, body: JSON.stringify({ transcript: 'Dana Price, 44 Elm St, gutter cleaning Saturday 10am, 250 dollars' }) }); return { status: r.status, body: await r.json() }; });
  res.push({ target: 'api/parse-job (mock returns Roofing + today)', ...api });
  await p.locator('.sw-bn .sw-bi:has(.sw-lb:text-is("Jobs"))').first().evaluate((e) => e.click()); await sleep(500);
  await p.locator('main button:has-text("+ New Job")').first().click(); await sleep(400);
  await p.locator('input[aria-label="Type the job instead of speaking"]').fill('Dana Price, 44 Elm St, gutter cleaning Saturday 10am, 250 dollars');
  await p.locator('button:has-text("Fill in")').click(); await sleep(1500);
  await p.locator('div[style*="max-width: 440px"]').last().screenshot({ path: `${OUT}/typed-gutter-saturday.png` });
  res.push({ target: 'typed review card', review: (await p.locator('text=Check these details before saving').locator('..').innerText()).replace(/\n/g, ' | '),
    jobTypeSelect: await p.locator('div[style*="max-width: 440px"] select').first().inputValue(), date: await p.locator('div[style*="max-width: 440px"] input[type="date"]').first().inputValue() });
  await fetch('http://127.0.0.1:54401/__mode?m=fenced'); await b.close();
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(res, null, 1)); console.log(JSON.stringify(res, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
