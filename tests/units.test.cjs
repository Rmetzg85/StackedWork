// Estimate line-item units: "job" exists and unknown saved units round-trip. Run via `npm run test:parser`.
const test = require("node:test"); const assert = require("node:assert/strict");
const { LINE_ITEM_UNITS, unitOptions } = require("../.tmp-test/lib/units.js");
test("'job' (flat rate) is a unit option", () => {
  const job = LINE_ITEM_UNITS.find((u) => u.value === "job");
  assert.ok(job); assert.equal(job.label, "job (flat rate)");
  assert.equal(LINE_ITEM_UNITS[0].value, "hours", "new line items still default to hours");
});
test("saved 'job' unit selects job, not hours", () => {
  assert.equal(unitOptions("job").filter((u) => u.value === "job").length, 1);
  assert.equal(unitOptions("job").length, LINE_ITEM_UNITS.length);
});
test("unknown saved unit is kept as an option", () => {
  const o = unitOptions("lump sum"); assert.equal(o[o.length - 1].value, "lump sum"); assert.equal(o.length, LINE_ITEM_UNITS.length + 1);
  assert.equal(unitOptions("").length, LINE_ITEM_UNITS.length); assert.equal(unitOptions(undefined).length, LINE_ITEM_UNITS.length);
});
