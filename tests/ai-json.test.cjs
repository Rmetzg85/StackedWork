// Model JSON parsing for /api/scan-receipt, /api/estimate-ai-price, /api/parse-job.
// QA (2026-10-02 §5d): scan-receipt 500'd on "Unexpected token '`'" because the model fenced its JSON.
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseModelJson } = require("../.tmp-test/lib/ai-json.js");

test("```json fenced object (the prod failure)", () => {
  const out = parseModelJson('```json\n{"vendor":"Home Depot","total":42.17,"category":"Materials"}\n```');
  assert.deepEqual(out, { vendor: "Home Depot", total: 42.17, category: "Materials" });
});
test("bare fence, prose around it", () => {
  assert.equal(parseModelJson('Here you go:\n```\n{"a":1}\n```\nThanks!').a, 1);
});
test("prose then object then trailing text with braces", () => {
  assert.deepEqual(parseModelJson('Sure! {"line_items":[{"description":"Labor {est}","total":100}],"notes":"ok"} Let me know {if} needed'),
    { line_items: [{ description: "Labor {est}", total: 100 }], notes: "ok" });
});
test("plain JSON", () => { assert.equal(parseModelJson('{"x":"y"}').x, "y"); });
test("garbage / empty / truncated -> null, never throws", () => {
  for (const s of ["", null, undefined, "no json here", "```json\n{\"a\":1,", "{not json}", "[1,2,3]"]) assert.equal(parseModelJson(s), null, String(s));
});
