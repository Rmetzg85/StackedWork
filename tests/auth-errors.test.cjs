// Signup/sign-in error messages + existing-account detection. Run: npm run test:parser
const test = require("node:test");
const assert = require("node:assert/strict");
const { friendlyAuthError: f, isExistingAccountSignup } = require("../.tmp-test/lib/auth-errors.js");

test("Supabase errors map to plain language with the right next action", () => {
  const cases = [
    [{ message: "User already registered", code: "user_already_exists" }, "already_registered", "signin"],
    [{ message: "User already registered" }, "already_registered", "signin"],
    [{ message: "Email rate limit exceeded", code: "over_email_send_rate_limit" }, "email_rate_limit", null],
    [{ message: "For security purposes, you can only request this after 37 seconds.", code: "over_request_rate_limit" }, "request_rate_limit", null],
    [{ message: "Email not confirmed", code: "email_not_confirmed" }, "email_not_confirmed", "resend"],
    [{ message: "Invalid login credentials", code: "invalid_credentials" }, "invalid_credentials", "forgot"],
    [{ message: "Password should be at least 6 characters.", code: "weak_password" }, "weak_password", null],
    [{ message: "Unable to validate email address: invalid format", code: "validation_failed" }, "invalid_email", null],
    [{ message: 'Email address "a@b" is invalid', code: "email_address_invalid" }, "invalid_email", null],
    [{ message: "Signups not allowed for this instance", code: "signup_disabled" }, "signup_disabled", null],
    [{ message: "Error sending confirmation email" }, "email_send_failed", "resend"],
    [{ name: "TypeError", message: "Failed to fetch" }, "network", null],
    [{ message: "Load failed" }, "network", null],
  ];
  for (const [err, code, action] of cases) {
    const r = f(err, "signup");
    assert.equal(r.code, code, err.message);
    assert.equal(r.action, action, err.message);
    assert.ok(r.message.length > 10 && !/undefined/.test(r.message));
  }
});

test("unknown errors keep the original text; empty ones get a generic message", () => {
  assert.equal(f({ message: "Something odd" }, "signup").message, "Something odd");
  assert.match(f(null, "signup").message, /creating your account/);
  assert.match(f({}, "signin").message, /Something went wrong/);
});

test("existing account = signUp success with a user that has no identities", () => {
  assert.equal(isExistingAccountSignup({ user: { identities: [] } }), true);
  assert.equal(isExistingAccountSignup({ user: { identities: [{ id: "x" }] } }), false);
  assert.equal(isExistingAccountSignup({ user: {} }), false);
  assert.equal(isExistingAccountSignup(null), false);
});
