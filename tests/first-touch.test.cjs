// First-touch capture incl. ?trade= (founder outreach links). Run: npm run test:parser
const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeTrade, mergeFirstTouch, cleanFirstTouch, KNOWN_TRADES } = require("../.tmp-test/lib/first-touch.js");

test("normalizeTrade: lowercase, [a-z0-9-] only, max 32", () => {
  assert.equal(normalizeTrade("HVAC"), "hvac");
  assert.equal(normalizeTrade(" Plumbing "), "plumbing");
  assert.equal(normalizeTrade("tile_&_stone!"), "tilestone");
  assert.equal(normalizeTrade("pool-service"), "pool-service");
  assert.equal(normalizeTrade("a".repeat(50)), "a".repeat(32));
  assert.equal(normalizeTrade("<script>"), "script");
  assert.equal(normalizeTrade(""), "");
  assert.equal(normalizeTrade(null), "");
  assert.equal(normalizeTrade(42), "");
  for (const t of KNOWN_TRADES) assert.equal(normalizeTrade(t), t);
  assert.deepEqual([...KNOWN_TRADES], ["plumbing", "hvac", "electrical", "roofing", "general"]);
});

test("mergeFirstTouch: first visit stores UTMs + trade", () => {
  assert.deepEqual(mergeFirstTouch(null, "?trade=HVAC&utm_source=email&utm_campaign=founder&play=1"),
    { first_touch_utm_source: "email", first_touch_utm_campaign: "founder", first_touch_trade: "hvac" });
  assert.deepEqual(mergeFirstTouch(null, "?trade=hvac"), { first_touch_trade: "hvac" });
  assert.equal(mergeFirstTouch(null, "?play=1"), null);
  assert.equal(mergeFirstTouch(null, "?trade=!!!"), null);
});

test("mergeFirstTouch: never overwrites; adds a trade to a record without one", () => {
  const s = { first_touch_utm_source: "fb" };
  assert.equal(mergeFirstTouch(s, "?utm_source=email"), null);
  assert.deepEqual(mergeFirstTouch(s, "?utm_source=email&trade=roofing"), { first_touch_utm_source: "fb", first_touch_trade: "roofing" });
  assert.equal(mergeFirstTouch({ first_touch_trade: "plumbing" }, "?trade=hvac"), null);
});

test("cleanFirstTouch: keeps whitelisted keys, re-normalizes trade", () => {
  assert.deepEqual(cleanFirstTouch({ first_touch_trade: "HVAC!!", first_touch_utm_source: "email", evil: "x" }), { first_touch_utm_source: "email", first_touch_trade: "hvac" });
  assert.deepEqual(cleanFirstTouch(null), {});
});
