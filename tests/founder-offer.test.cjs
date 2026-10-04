// Staged founder offer: copy helpers + spot counting (fake Stripe, no network). Run: npm run test:parser
const test = require("node:test");
const assert = require("node:assert/strict");
const O = require("../.tmp-test/lib/offer.js");
const F = require("../.tmp-test/lib/founder.js");

test("constants and copy match the acquisition doc", () => {
  assert.equal(O.STANDARD_TRIAL_DAYS, 14); assert.equal(O.FOUNDER_TRIAL_DAYS, 60); assert.equal(O.FOUNDER_LIMIT, 20);
  assert.equal(O.FOUNDER_HEADLINE, "Founding contractors: 60 days free, then $29.99/mo locked in.");
  assert.equal(O.FOUNDER_SUB, "No credit card. If you don't add one, it just ends. Regular price $49.99/mo.");
});

test("offer off by default and on any unexpected response", () => {
  for (const raw of [null, undefined, {}, { active: false }, { active: "true" }, { active: true, spotsLeft: 0 }]) {
    assert.deepEqual(O.parseFounderStatus(raw), O.FOUNDER_OFF, JSON.stringify(raw));
  }
  assert.equal(O.trialDays(O.FOUNDER_OFF), 14);
  assert.equal(O.founderBadge(O.FOUNDER_OFF), null);
});

test("badge shows only the live count, never an invented one", () => {
  const on = O.parseFounderStatus({ active: true, spotsLeft: 7 });
  assert.deepEqual(on, { active: true, spotsLeft: 7, limit: 20 });
  assert.equal(O.trialDays(on), 60);
  assert.equal(O.founderBadge(on), "Founder pricing · 7 of 20 spots left");
  // Out-of-range / missing counts don't render a number.
  assert.equal(O.founderBadge(O.parseFounderStatus({ active: true, spotsLeft: 99 })), "Founder pricing · first 20 contractors");
  assert.equal(O.founderBadge(O.parseFounderStatus({ active: true })), "Founder pricing · first 20 contractors");
});

function fakeStripe(subs, coupon) {
  const calls = { search: [], coupon: 0 };
  return { calls, subscriptions: { search: async (q) => { calls.search.push(q); const start = q.page ? Number(q.page) : 0; const data = subs.slice(start, start + q.limit); const more = start + q.limit < subs.length; return { data, has_more: more, next_page: more ? String(start + q.limit) : null }; } },
    coupons: { retrieve: async () => { calls.coupon++; return coupon; } } };
}
const sub = (i, status, email) => ({ id: `sub_${i}`, status, metadata: { offer: "founder" }, customer: { id: `cus_${i}`, email: email || `c${i}@example.test` } });

test("not configured -> null (standard path), no Stripe calls", async () => {
  delete process.env.STRIPE_FOUNDER_COUPON_ID;
  const s = fakeStripe([], null);
  assert.equal(await F.founderSpotsLeft(s, { fresh: true }), null);
  assert.equal(s.calls.search.length, 0);
});

test("counts every founder subscription in any status (incl. canceled), minus FOUNDER_EXCLUDE", async () => {
  process.env.STRIPE_FOUNDER_COUPON_ID = "FOUNDER2999";
  process.env.FOUNDER_EXCLUDE = "smoke@example.test, cus_owner";
  const subs = [sub(1, "trialing"), sub(2, "canceled"), sub(3, "active"), sub(4, "incomplete_expired"), sub(5, "trialing", "smoke@example.test"), { ...sub(6, "active"), customer: { id: "cus_owner", email: "o@example.test" } }];
  const s = fakeStripe(subs, { valid: true, max_redemptions: 20, times_redeemed: 4 });
  assert.equal(await F.countFounderSubscriptions(s), 4);
  assert.equal(s.calls.search[0].query, "metadata['offer']:'founder'");
  assert.equal(await F.founderSpotsLeft(s, { fresh: true }), 16);
});

test("coupon cap wins when it's lower; exhausted or invalid coupon -> 0", async () => {
  process.env.STRIPE_FOUNDER_COUPON_ID = "FOUNDER2999"; process.env.FOUNDER_EXCLUDE = "";
  assert.equal(await F.founderSpotsLeft(fakeStripe([sub(1, "trialing")], { valid: true, max_redemptions: 20, times_redeemed: 18 }), { fresh: true }), 2);
  assert.equal(await F.founderSpotsLeft(fakeStripe([], { valid: true, max_redemptions: 20, times_redeemed: 20 }), { fresh: true }), 0);
  assert.equal(await F.founderSpotsLeft(fakeStripe([], { valid: false }), { fresh: true }), 0);
  const many = Array.from({ length: 25 }, (_, i) => sub(i, "trialing"));
  assert.equal(await F.founderSpotsLeft(fakeStripe(many, { valid: true, max_redemptions: 20, times_redeemed: 0 }), { fresh: true }), 0, "paginates and caps at 0");
});

test("Stripe errors propagate (checkout then falls back to the standard 14-day path)", async () => {
  process.env.STRIPE_FOUNDER_COUPON_ID = "FOUNDER2999";
  const bad = { subscriptions: { search: async () => { throw new Error("search unavailable"); } }, coupons: { retrieve: async () => ({ valid: true }) } };
  await assert.rejects(F.founderSpotsLeft(bad, { fresh: true }), /search unavailable/);
  delete process.env.STRIPE_FOUNDER_COUPON_ID; delete process.env.FOUNDER_EXCLUDE;
});
