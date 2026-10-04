// Trial length = one constant (TRIAL_DAYS = 30). Guards against hard-coded 14-day copy creeping back. Run: npm run test:parser
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const O = require("../.tmp-test/lib/offer.js");

test("TRIAL_DAYS is 30 and the standard (founder-off) path uses it", () => {
  assert.equal(O.TRIAL_DAYS, 30);
  assert.equal(O.trialDays(O.FOUNDER_OFF), 30);
  assert.equal(O.trialDays(null), 30);
});

test("client-safe offer module carries no founder price/length", () => {
  const s = fs.readFileSync(path.join(__dirname, "..", "app/lib/offer.ts"), "utf8");
  assert.doesNotMatch(s, /29\.99|\b60\b/);
});

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(tsx?|js|cjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

test("no hard-coded 14-day / 14 días / fourteen-day trial copy left in app/", () => {
  const bad = [];
  for (const f of walk(path.join(__dirname, "..", "app"))) {
    const s = fs.readFileSync(f, "utf8");
    if (/\b14[- ]?(day|d[ií]a)|catorce d|fourteen[- ]day/i.test(s)) bad.push(path.relative(process.cwd(), f));
  }
  assert.deepEqual(bad, []);
});

test("checkout takes the trial length from the constants and still allows no-card trials", () => {
  const s = fs.readFileSync(path.join(__dirname, "..", "app/api/checkout/route.ts"), "utf8");
  assert.match(s, /trial_period_days: founder \? FOUNDER_TRIAL_DAYS : TRIAL_DAYS/);
  assert.match(s, /payment_method_collection: "if_required"/);
  assert.match(s, /missing_payment_method: "cancel"/);
  assert.doesNotMatch(s, /trial_period_days:\s*\d/);
});
