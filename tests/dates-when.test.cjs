// fmtWhenNY: voice review card "When" formatting (America/New_York). Run via `npm run test:parser`.
const test = require("node:test"); const assert = require("node:assert");
const { fmtWhenNY } = require("../.tmp-test/lib/dates.js");
test("zone-less local date-time shows as NY wall clock", () => {
  assert.equal(fmtWhenNY("2026-10-06T10:00"), "Tue, Oct 6 · 10:00 AM");
  assert.equal(fmtWhenNY("2026-10-06T00:05"), "Tue, Oct 6 · 12:05 AM");
  assert.equal(fmtWhenNY("2026-10-06T12:30"), "Tue, Oct 6 · 12:30 PM");
  assert.equal(fmtWhenNY("2026-12-31T23:59:00"), "Thu, Dec 31 · 11:59 PM");
});
test("date-only shows without a time", () => {
  assert.equal(fmtWhenNY("2026-10-06"), "Tue, Oct 6");
  assert.equal(fmtWhenNY("2027-01-01"), "Fri, Jan 1");
});
test("instants convert to America/New_York (EDT and EST)", () => {
  assert.equal(fmtWhenNY("2026-10-06T14:00:00Z"), "Tue, Oct 6 · 10:00 AM");
  assert.equal(fmtWhenNY("2026-12-01T02:30:00Z"), "Mon, Nov 30 · 9:30 PM");
  assert.equal(fmtWhenNY("2026-10-06T10:00:00-04:00"), "Tue, Oct 6 · 10:00 AM");
});
test("empty and junk", () => {
  assert.equal(fmtWhenNY(null), ""); assert.equal(fmtWhenNY(""), ""); assert.equal(fmtWhenNY("next week"), "next week");
});
