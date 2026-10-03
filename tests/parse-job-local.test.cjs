// QA's 12 realistic phrases (/workspace/qa/parser-test/run-table.js, 2026-10-02) plus
// address/phone/date/time checks. Run: npm run test:parser
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseVoiceToJobLocal, jobTypeFromText } = require("../.tmp-test/lib/parse-job-local.js");

const TODAY = "2026-10-02"; // a Friday
const cases = [
  ["Mike Johnson, 123 Oak St, lawn mow Friday 2pm", { name: "Mike Johnson", value: "", status: "scheduled", address: "123 Oak St", date: "2026-10-02", time: "14:00" }],
  ["John Smith, plumbing, $850, scheduled", { name: "John Smith", jobType: "Plumbing", value: "850", status: "scheduled" }],
  ["Donna Newton kitchen remodel 2500", { name: "Donna Newton", value: "2500" }],
  ["Brandon Ford tenant unit leak", { name: "Brandon Ford", jobType: "Plumbing" }],
  ["Bob Decker shower heat pump install", { name: "Bob Decker", jobType: "HVAC" }],
  ["Phil Forest mother-in-law suite painting $1,200.50", { name: "Phil Forest", jobType: "Painting", value: "1200.50" }],
  ["Sarah Lee, 410 555 0182, replace water heater, fifteen hundred dollars", { name: "Sarah Lee", jobType: "Plumbing", value: "1500", phone: "(410) 555-0182" }],
  ["um so this is for Carlos Ruiz on Elm, deck stain, like four hundred bucks, done", { name: "Carlos Ruiz", jobType: "Deck", value: "400", status: "complete", address: "Elm" }],
  ["roof repair for the Hendersons 3,200 dollars next Tuesday", { name: "Hendersons", jobType: "Roofing", value: "3200", date: "2026-10-06", status: "scheduled" }],
  ["Kevin at 55 Main Street needs drywall patch 300", { name: "Kevin", jobType: "Drywall", value: "300", address: "55 Main Street" }],
  ["Maria Gonzalez electrical panel upgrade two thousand five hundred scheduled for Monday", { name: "Maria Gonzalez", jobType: "Electrical", value: "2500", status: "scheduled", date: "2026-10-05" }],
  ["Tom Bradley AC not cooling started yesterday 175 dollars", { name: "Tom Bradley", jobType: "HVAC", value: "175", status: "in-progress", date: "2026-10-01" }],
];

let pass = 0;
for (const [i, [phrase, exp]] of cases.entries()) {
  test(`QA #${i + 1}: ${phrase}`, () => {
    const out = parseVoiceToJobLocal(phrase, TODAY);
    for (const [k, v] of Object.entries(exp)) assert.equal(out[k], v, `${k} for "${phrase}" -> ${JSON.stringify(out)}`);
    pass++;
  });
}

test("service description is kept", () => {
  assert.equal(parseVoiceToJobLocal("Mike Johnson, 123 Oak St, lawn mow Friday 2pm", TODAY).service, "lawn mow");
  assert.match(parseVoiceToJobLocal("Sarah Lee, 410 555 0182, replace water heater, fifteen hundred dollars", TODAY).service, /replace water heater/);
});
test("lowercase transcript still gets a name", () => {
  const o = parseVoiceToJobLocal("mike johnson 123 oak st lawn mow friday 2pm", TODAY);
  assert.equal(o.name, "Mike Johnson");
  assert.equal(o.address, "123 oak st");
  assert.equal(o.value, "");
});
test("quantities are not prices", () => {
  assert.equal(parseVoiceToJobLocal("Ann Lee 300 sq ft tile floor", TODAY).value, "");
  assert.equal(parseVoiceToJobLocal("Ann Lee floor 3k", TODAY).value, "3000");
});
test("job-type keyword mapping (QA: water heater / AC / lawn were General)", () => {
  const m = { "water heater replacement": "Plumbing", "replace water heater": "Plumbing", "AC not cooling": "HVAC", "furnace tune-up": "HVAC", "HVAC service": "HVAC",
    "lawn mow": "Landscaping", "landscaping cleanup": "Landscaping", "electrical panel upgrade": "Electrical", "roof repair": "Roofing", "kitchen repaint": "Painting",
    "drywall patch": "Drywall", "deck stain": "Deck", "tile floor": "Flooring", "leaky faucet": "Plumbing", "kitchen remodel": "General" };
  for (const [k, v] of Object.entries(m)) assert.equal(jobTypeFromText(k), v, k);
  assert.equal(parseVoiceToJobLocal("Mike Johnson, 123 Oak St, lawn mow Friday 2pm", TODAY).jobType, "Landscaping");
});
test.after(() => console.log(`\nQA phrase score: ${pass}/${cases.length}`));

// "<job> for <Name>": the name after "for" wins over a leading capitalised word (2026-10-03).
const forCases = [
  ["Water heater replacement for Mike Davis at 42 Oak Street, Tuesday at 10, $1,850", { name: "Mike Davis", jobType: "Plumbing", address: "42 Oak Street", date: "2026-10-06", time: "10:00", value: "1850", status: "scheduled" }],
  ["Water Heater replacement for Mike Davis at 42 Oak Street Tuesday at 10:00 a.m. 1850", { name: "Mike Davis", jobType: "Plumbing", address: "42 Oak Street", date: "2026-10-06", time: "10:00", value: "1850" }],
  ["AC tune-up for Sarah Lee tomorrow at 3", { name: "Sarah Lee", jobType: "HVAC", date: "2026-10-03", time: "15:00", status: "scheduled" }],
  ["Lawn mowing for the Johnsons Friday", { name: "Johnsons", jobType: "Landscaping", date: "2026-10-02" }],
  ["Deck stain for Mrs. Patel next Monday, 600", { name: "Mrs. Patel", jobType: "Deck", date: "2026-10-05", value: "600" }],
  ["Roof inspection for Tom Reed on Thursday", { name: "Tom Reed", jobType: "Roofing", date: "2026-10-08" }],
  ["Painting for Friday", { name: "" }],
];
for (const [phrase, exp] of forCases) {
  test(`for-name: ${phrase}`, () => {
    const out = parseVoiceToJobLocal(phrase, TODAY);
    for (const [k, v] of Object.entries(exp)) assert.equal(out[k], v, `${k} for "${phrase}" -> ${JSON.stringify(out)}`);
  });
}
test("bare 'at N' hour isn't taken from quantities or prices", () => {
  assert.equal(parseVoiceToJobLocal("Mike Johnson gutter cleaning at 3 houses", TODAY).time, "");
  assert.equal(parseVoiceToJobLocal("John Smith fence repair at 45 dollars", TODAY).time, "");
});
