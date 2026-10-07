// Guards for the /login form: a native (pre-hydration) submit must never put credentials in a URL.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const src = fs.readFileSync(path.join(__dirname, "..", "app", "login", "LoginClient.tsx"), "utf8");

test("login form posts (never GET) so a native submit can't build a query string", () => {
  const forms = src.match(/<form\b[^>]*>/g) || [];
  assert.ok(forms.length >= 1);
  for (const f of forms) assert.match(f, /method="post"/, f);
});

test("email and password inputs have no name attribute (not serialised even by a native submit)", () => {
  const inputs = src.match(/<input\b[\s\S]*?\/>/g) || [];
  const creds = inputs.filter((i) => /type="email"|showPassword|autoComplete="(new-|current-)password"/.test(i));
  assert.ok(creds.length >= 2, "expected the email and password inputs");
  for (const i of creds) assert.doesNotMatch(i, /\bname=/, i);
});

test("submit is disabled until hydrated", () => {
  assert.match(src, /useState\(false\)[\s\S]*setReady\(true\)/);
  assert.match(src, /type="submit" disabled=\{loading \|\| !ready\}/);
});
