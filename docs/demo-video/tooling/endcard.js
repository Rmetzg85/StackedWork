const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 780, height: 1568 } });
  await p.goto('file://' + __dirname + '/endcard.html', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: __dirname + '/endcard.jpg', type: 'jpeg', quality: 92 }); await b.close(); })();
