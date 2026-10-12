// Spanish yard-sign welcome: detection + persistence. Run: npm run test:parser
const test = require("node:test");
const assert = require("node:assert/strict");
const { detectEs, parseLangCookie, langCookieString } = require("../.tmp-test/lib/es-lang.js");
const QR = "?utm_source=yard_sign&utm_medium=print&utm_campaign=es";

test("QR campaign and Spanish browsers get the Spanish welcome", () => {
  assert.equal(detectEs(QR, "en-US", null), "utm");
  assert.equal(detectEs("?utm_campaign=ES", "en-US", null), "utm");
  assert.equal(detectEs("?lang=es", "en-US", null), "utm");
  for (const l of ["es", "es-MX", "es-419", "ES-us", "es_ES"]) assert.equal(detectEs("", l, null), "browser", l);
});

test("English visitors see no change", () => {
  for (const l of ["en-US", "en", "fr-FR", "pt-BR", "est", "", null, undefined]) assert.equal(detectEs("", l, null), null, String(l));
  assert.equal(detectEs("?utm_source=yard_sign&utm_campaign=spring", "en-US", null), null);
  assert.equal(detectEs("?utm_campaign=esx", "en-US", null), null);
});

test("choice persists for the visit; View in English wins", () => {
  assert.equal(detectEs("", "en-US", "es"), "stored");
  assert.equal(detectEs(QR, "es-MX", "en"), null);
  assert.equal(parseLangCookie("a=1; sw_lang=es; b=2"), "es");
  assert.equal(parseLangCookie("sw_lang=en"), "en");
  assert.equal(parseLangCookie("x_sw_lang=es"), null);
  assert.equal(parseLangCookie("sw_lang=fr"), null);
  assert.equal(parseLangCookie(""), null);
  const c = langCookieString("es", true);
  assert.match(c, /^sw_lang=es; Path=\/; SameSite=Lax; Secure$/);
  assert.doesNotMatch(c, /Max-Age|Expires/i); // session cookie = this visit only
  assert.equal(parseLangCookie(c.split(";")[0]), "es");
});
