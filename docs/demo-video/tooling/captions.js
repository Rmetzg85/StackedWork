// Renders caption overlays (transparent PNGs) with the app's own font (DM Sans) via Chrome.
const { chromium } = require('playwright'); const fs = require('fs');
const caps = JSON.parse(fs.readFileSync(process.argv[2])); const out = process.argv[3]; const W = Number(process.argv[4] || 780);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: 200 } });
  for (const [i, c] of caps.entries()) {
    await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@700;800&display=block" rel="stylesheet"><style>
      html,body{margin:0;background:transparent} .w{width:${W}px;display:flex;justify-content:center;padding-top:14px}
      .c{font-family:'DM Sans';font-weight:800;font-size:${Math.round(W * 0.066)}px;line-height:1.1;color:#132440;background:#C8E64A;padding:${Math.round(W*0.022)}px ${Math.round(W*0.04)}px;border-radius:${Math.round(W*0.03)}px;box-shadow:0 6px 24px rgba(0,0,0,.35);letter-spacing:-0.01em;text-align:center;max-width:${Math.round(W*0.9)}px}
    </style></head><body><div class="w"><div class="c">${c.text}</div></div></body></html>`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const box = await p.locator('.w').boundingBox();
    await p.screenshot({ path: `${out}/cap${i}.png`, omitBackground: true, clip: { x: 0, y: 0, width: W, height: Math.ceil(box.height + 20) } });
  }
  await b.close();
})();
