// SEO/GEO: JSON-LD shape, FAQ consistency, honest landing copy, sitemap/robots lists. Run: npm run test:parser
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TRIAL_DAYS, LIST_PRICE } = require("../.tmp-test/lib/offer.js");
const { softwareApplicationLd, faqPageLd, ldJson, PRICE_NUMBER } = require("../.tmp-test/lib/seo.js");
const { FAQS } = require("../.tmp-test/lib/faq.js");
const { LANDING_PAGES, landingWordCount } = require("../.tmp-test/lib/landing-pages.js");
const { SITEMAP_PATHS, DISALLOWED_PATHS, RESOURCE_PAGES, SITE_URL } = require("../.tmp-test/lib/site.js");
const { llmsTxt } = require("../.tmp-test/lib/llms.js");

const deepKeys = (o, out = []) => { if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) { out.push(k); deepKeys(v, out); } return out; };

test("SoftwareApplication JSON-LD matches the real offer and has no ratings/reviews", () => {
  const ld = softwareApplicationLd();
  assert.equal(ld["@context"], "https://schema.org");
  assert.equal(ld["@type"], "SoftwareApplication");
  assert.equal(ld.name, "StackedWork");
  assert.equal(ld.applicationCategory, "BusinessApplication");
  assert.ok(ld.operatingSystem);
  assert.equal(ld.offers["@type"], "Offer");
  assert.equal(ld.offers.price, PRICE_NUMBER);
  assert.equal(`$${ld.offers.price}`, LIST_PRICE);
  assert.equal(ld.offers.priceCurrency, "USD");
  assert.equal(ld.offers.priceSpecification.unitCode, "MON");
  assert.match(ld.offers.description, new RegExp(`^${TRIAL_DAYS}-day free trial, no credit card required`));
  const keys = deepKeys(ld);
  for (const bad of ["aggregateRating", "review", "reviews", "ratingValue"]) assert.ok(!keys.includes(bad), bad);
  assert.ok(ld.url.startsWith("https://www."));
});

test("FAQPage JSON-LD is exactly the visible FAQ text", () => {
  assert.ok(FAQS.length >= 10 && FAQS.length <= 15, String(FAQS.length));
  const ld = faqPageLd(FAQS);
  assert.equal(ld["@type"], "FAQPage");
  assert.equal(ld.mainEntity.length, FAQS.length);
  ld.mainEntity.forEach((q, i) => {
    assert.equal(q["@type"], "Question"); assert.equal(q.name, FAQS[i].q);
    assert.equal(q.acceptedAnswer["@type"], "Answer"); assert.equal(q.acceptedAnswer.text, FAQS[i].a);
  });
  // /faq renders both from the same FAQS array
  const src = fs.readFileSync(path.join(__dirname, "..", "app", "faq", "page.tsx"), "utf8");
  assert.match(src, /faqPageLd\(FAQS\)/); assert.match(src, /\{f\.q\}/); assert.match(src, /\{f\.a\}/);
  assert.doesNotMatch(ldJson({ a: "</script><b>" }), /<\/script/);
});

test("FAQ states the live offer and stays honest", () => {
  const all = FAQS.map((f) => f.q + " " + f.a).join("\n");
  assert.match(all, new RegExp(`\\${LIST_PRICE} per month after a ${TRIAL_DAYS}-day free trial`));
  assert.match(all, /does not require a credit card/);
  assert.match(all, /does not collect payments/);
  assert.match(all, /in English for now/);
  for (const f of FAQS) assert.ok(/[.:]/.test(f.a.split(/(?<=[.:])\s/)[0]), f.q); // first sentence stands alone
});

const BANNED = /maryland|servicetitan|jobber|housecall|quickbooks|testimonial|guarantee|more leads|get leads|marketplace|build (you )?a website|accept (card|online) payments|get paid online|pay online|\b\d+% |\bthousands of\b/i;

test("landing pages: 500–900 words, honest, region-neutral, price and trial stated", () => {
  const slugs = Object.keys(LANDING_PAGES);
  assert.ok(slugs.length >= 3 && slugs.length <= 4);
  for (const s of slugs) {
    const p = LANDING_PAGES[s];
    const n = landingWordCount(p);
    assert.ok(n >= 500 && n <= 900, `${s}: ${n} words`);
    const text = JSON.stringify(p);
    assert.doesNotMatch(text, BANNED, s);
    assert.ok(text.includes(LIST_PRICE) && text.includes(`${TRIAL_DAYS}`), s);
    assert.ok(p.title.length <= 75, `${s} title ${p.title.length}`);
    assert.ok(p.description.length >= 110 && p.description.length <= 170, `${s} desc ${p.description.length}`);
    assert.ok(fs.existsSync(path.join(__dirname, "..", "app", s, "page.tsx")), s);
    for (const sec of p.sections) if (sec.image) assert.ok(fs.existsSync(path.join(__dirname, "..", "public", sec.image.src)), sec.image.src);
  }
  // "free" only as in the free trial, then the real price, said plainly
  const free = LANDING_PAGES["free-contractor-invoice-app"];
  assert.match(free.intro[0], new RegExp(`free for ${TRIAL_DAYS} days`)); assert.match(free.intro[0], /no free-forever plan/);
  assert.doesNotMatch(JSON.stringify(LANDING_PAGES), BANNED);
  assert.doesNotMatch(FAQS.map((f) => f.a).join(" "), BANNED);
});

test("sitemap, robots and footer lists", () => {
  assert.equal(SITE_URL, "https://www.letstaystacked.com");
  for (const s of Object.keys(LANDING_PAGES)) { assert.ok(SITEMAP_PATHS.includes(`/${s}`)); assert.ok(RESOURCE_PAGES.some((r) => r.path === `/${s}`)); }
  assert.ok(SITEMAP_PATHS.includes("/faq") && SITEMAP_PATHS.includes("/"));
  for (const d of ["/api/", "/invoice/", "/estimate/", "/welcome", "/reset-password", "/l/"]) assert.ok(DISALLOWED_PATHS.includes(d), d);
  for (const p of SITEMAP_PATHS) assert.ok(!DISALLOWED_PATHS.some((d) => p.startsWith(d)), p);
  const t = llmsTxt();
  assert.match(t, /^# StackedWork/); assert.ok(t.includes(LIST_PRICE) && t.includes(`${TRIAL_DAYS}-day`)); assert.match(t, /Does NOT collect payments/);
  for (const r of RESOURCE_PAGES) assert.ok(t.includes(SITE_URL + r.path));
});
