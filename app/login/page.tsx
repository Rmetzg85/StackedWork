"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { captureFirstTouch, getFirstTouch } from "../lib/first-touch";
import { useFounderOffer } from "../lib/use-founder-offer";
import { trialDays, LIST_PRICE } from "../lib/offer";
import { friendlyAuthError, isExistingAccountSignup, type AuthErrorAction } from "../lib/auth-errors";
import { funnel } from "../lib/funnel";
import Honeypot from "../components/Honeypot";
import { HONEYPOT_FIELD } from "../lib/honeypot-field";

const G = "#C8E64A";
const GD = "#A8C435";

// Env only (set in Vercel and .env.production). No hard-coded fallback: the old one pointed at a different Supabase project.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Implicit flow so the confirmation link signs the user in on any device (PKCE needs the original browser).
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true } });
// Email-confirmation redirect. Must be listed in Supabase Auth → URL Configuration → Redirect URLs.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.letstaystacked.com").replace(/\/+$/, "");
const CONFIRM_REDIRECT = `${SITE_URL}/?firstrun=1`;

function LoginForm() {
  const founder = useFounderOffer();
  // Signup is the default and is what the server pre-renders, so the form is visible at first paint (no empty
  // card / layout shift). ?mode=signin and ?email= are applied right after hydration.
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const [errorAction, setErrorAction] = useState<AuthErrorAction>(null);
  const [resent, setResent] = useState(false);
  // Set by a real keypress/tap in the form. A filled honeypot only counts as a bot when nobody typed:
  // some password managers/autofill fill every text field, and a real person must never get a fake success.
  const human = useRef(false);
  const markHuman = (e: { isTrusted: boolean }) => { if (e.isTrusted) human.current = true; };

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const m = q.get("mode") === "signin" ? "signin" : "signup";
    if (m !== "signup") setMode(m);
    const em = q.get("email"); if (em) setEmail(em.slice(0, 254));
    funnel(m === "signup" ? "signup_view" : "signin_view");
    // Ads may link straight to /login — capture first-touch UTM here too (no-op if already stored).
    captureFirstTouch();
  }, []);

  const clearMsgs = () => { setError(null); setErrorAction(null); setSuccess(null); setResent(false); };
  const switchMode = (m: "signin" | "signup" | "forgot") => { setMode(m); clearMsgs(); };

  const resendConfirmation = async () => {
    const addr = email.trim();
    if (!addr) { setError("Enter your email above, then tap resend."); return; }
    setLoading(true);
    try {
      const { error: rErr } = await supabase.auth.resend({ type: "signup", email: addr, options: { emailRedirectTo: CONFIRM_REDIRECT } });
      if (rErr) throw rErr;
      funnel("signup_resend");
      setError(null); setErrorAction(null); setResent(true);
      setSuccess(`Sent again to ${addr}. It can take a minute. Check spam or Promotions too.`);
    } catch (err) {
      const f = friendlyAuthError(err, "signup"); setError(f.message); setErrorAction(f.action === "resend" ? null : f.action);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMsgs();
    setLoading(true);

    try {
      if (mode === "signup") {
        funnel("signup_submit");
        // Honeypot filled and nobody typed = bot: show the normal message and create nothing (no auth user, no email).
        if (hp.trim() && !human.current) {
          funnel("signup_honeypot");
          setResent(true); // no "resend" offer on the fake success
          setSuccess(`Check your email to confirm your account. We sent a confirmation link to ${email.trim()}.`);
          return;
        }
        // Short signup: email + password only. Username is derived from the email
        // (editable later in Settings); phone/website are collected later.
        const cleanEmail = email.trim();
        const username = (cleanEmail.split("@")[0] || "").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 30);
        const firstTouch = getFirstTouch();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { username, ...firstTouch },
            // "Confirm email" is ON: the confirmation link lands on the first-run screen (any device).
            emailRedirectTo: CONFIRM_REDIRECT,
          },
        });
        if (signUpError) throw signUpError;

        // Already registered (Supabase hides this behind a "success" with no identities): send them to sign in.
        if (isExistingAccountSignup(signUpData)) {
          funnel("signup_existing_account");
          setMode("signin");
          setError("You already have an account with this email. Sign in below, or tap \u201cForgot password?\u201d.");
          return;
        }

        // First-run flag (same-device fallback; the confirm link's ?firstrun=1 covers other devices).
        try { window.localStorage.setItem("sw_firstrun", "1"); window.localStorage.setItem("sw_signup_email", cleanEmail); } catch { /* ignore */ }

        // No session = email confirmation required. Say so clearly before moving on to start the trial.
        const needsConfirm = !signUpData?.session;
        if (needsConfirm) {
          setSuccess(`Check your email to confirm your account. We sent a confirmation link to ${cleanEmail}. Starting your free trial…`);
        }
        const shownAt = Date.now();
        funnel("signup_created", { needs_confirm: needsConfirm });

        // Notify Ryan of new signup
        await fetch("/api/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // A person typed here, so an autofilled honeypot must not suppress the owner notification.
          body: JSON.stringify({ username, email: cleanEmail, ...firstTouch, [HONEYPOT_FIELD]: human.current ? "" : hp }),
        }).catch(() => {});

        // After signup, send them to Stripe checkout (no card needed for the trial).
        // The account already exists at this point, so a checkout problem must not look like a failed signup.
        let checkoutUrl: string | null = null;
        try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          // With a session (email confirmation off) the server can link the subscription to this user id.
          headers: {
            "Content-Type": "application/json",
            ...(signUpData?.session?.access_token ? { Authorization: `Bearer ${signUpData.session.access_token}` } : {}),
          },
          body: JSON.stringify({ email: cleanEmail, utm: firstTouch }),
        });
        const data = await res.json().catch(() => ({}));
        checkoutUrl = typeof data?.url === "string" ? data.url : null;
        } catch { checkoutUrl = null; }
        if (checkoutUrl) {
          funnel("signup_checkout_redirect");
          // Keep the "check your email" message on screen long enough to read.
          if (needsConfirm) await new Promise(r => setTimeout(r, Math.max(0, 2500 - (Date.now() - shownAt))));
          window.location.href = checkoutUrl;
        } else {
          funnel("signup_checkout_error");
          setSuccess(needsConfirm
            ? `Your account is created. Check your email (${cleanEmail}) and tap the confirmation link. You'll start your free trial from the app right after. Still no card.`
            : "Your account is created. Open the app to start your free trial. Still no card.");
        }
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (resetError) throw resetError;
        setSuccess("Password reset email sent! Check your inbox.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.href = "/";
      }
    } catch (err: any) {
      const f = friendlyAuthError(err, mode);
      funnel(mode === "signup" ? "signup_error" : mode === "signin" ? "signin_error" : "reset_error", { code: f.code });
      setError(f.message);
      setErrorAction(f.action);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tabs */}
      {mode !== "forgot" && (
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            className="tab"
            onClick={() => switchMode("signup")}
            style={{
              color: mode === "signup" ? G : "rgba(245,240,235,0.7)",
              borderBottomColor: mode === "signup" ? G : "transparent",
            }}
          >
            Sign Up
          </button>
          <button
            className="tab"
            onClick={() => switchMode("signin")}
            style={{
              color: mode === "signin" ? G : "rgba(245,240,235,0.7)",
              borderBottomColor: mode === "signin" ? G : "transparent",
            }}
          >
            Sign In
          </button>
        </div>
      )}

      <div style={{ padding: "28px 28px 32px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          {mode === "signup" ? "Start your free trial" : mode === "signin" ? "Welcome back" : "Reset your password"}
        </h1>
        {mode === "signup" ? (
          <div data-testid="signup-offer" style={{ margin: "10px 0 22px", padding: "12px 14px", background: "rgba(200,230,74,0.10)", border: "1px solid rgba(200,230,74,0.4)", borderRadius: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: G, lineHeight: 1.3 }}>
              {founder.active && founder.headline ? founder.headline : `${trialDays(founder)} days free \u00b7 No credit card`}
            </div>
            <div style={{ fontSize: 13, color: "rgba(245,240,235,0.85)", marginTop: 4, lineHeight: 1.5 }}>
              {founder.active && founder.sub ? founder.sub : `Then ${LIST_PRICE}/mo only if you add a card. If you don't, the trial just ends. Nothing to cancel.`}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "rgba(245,240,235,0.7)", marginBottom: 24 }}>
            {mode === "signin" ? "Sign in to access your StackedWork dashboard." : "Enter your email and we'll send you a reset link."}
          </p>
        )}

        <form onSubmit={handleSubmit} onKeyDownCapture={markHuman} onPointerDownCapture={markHuman} style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
          {mode === "signup" && <Honeypot value={hp} onChange={setHp} />}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(245,240,235,0.7)", marginBottom: 6 }}>
              Email
            </label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(245,240,235,0.7)", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 2,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 44,
                    height: 44,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(245,240,235,0.6)",
                    fontSize: 15,
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          )}

          {mode === "signin" && (
            <div style={{ textAlign: "right", marginTop: -6 }}>
              <span
                onClick={() => switchMode("forgot")}
                style={{ fontSize: 12, color: G, cursor: "pointer", fontWeight: 500 }}
              >
                Forgot password?
              </span>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#FCA5A5" }}>
              {error}
              {errorAction && (
                <div style={{ marginTop: 8 }}>
                  <button type="button" className="msg-action"
                    onClick={() => errorAction === "resend" ? resendConfirmation() : switchMode(errorAction === "signin" ? "signin" : "forgot")}>
                    {errorAction === "signin" ? "Sign in instead" : errorAction === "forgot" ? "Reset my password" : "Resend confirmation email"}
                  </button>
                </div>
              )}
            </div>
          )}

          {success && (
            <div style={{ padding: "10px 14px", background: "rgba(200,230,74,0.1)", border: "1px solid rgba(200,230,74,0.3)", borderRadius: 8, fontSize: 13, color: G }}>
              {success}
              {mode === "signup" && !resent && !loading && /Check your email/.test(success) && (
                <div style={{ marginTop: 8, color: "rgba(245,240,235,0.75)" }}>
                  Not there in a minute? Check spam or Promotions, or{" "}
                  <button type="button" className="msg-action" onClick={resendConfirmation}>resend it</button>.
                </div>
              )}
            </div>
          )}

          <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? (mode === "signup" ? "Creating account..." : mode === "signin" ? "Signing in..." : "Sending...")
              : (mode === "signup" ? "Create Account & Start Trial" : mode === "signin" ? "Sign In" : "Send Reset Link")}
          </button>
          {mode === "signup" && !success && (
            <p style={{ fontSize: 12, color: "rgba(245,240,235,0.65)", textAlign: "center", lineHeight: 1.5, marginTop: -2 }}>
              Next: tap &ldquo;Start trial&rdquo; on a secure Stripe page (no card), then confirm your email.
            </p>
          )}
        </form>

        {mode === "forgot" && (
          <p style={{ marginTop: 18, fontSize: 13, color: "rgba(245,240,235,0.35)", textAlign: "center" }}>
            <span
              onClick={() => switchMode("signin")}
              style={{ color: G, cursor: "pointer", fontWeight: 500 }}
            >
              ← Back to sign in
            </span>
          </p>
        )}

        {mode === "signup" && (
          <p style={{ marginTop: 18, fontSize: 11, color: "rgba(245,240,235,0.6)", textAlign: "center", lineHeight: 1.5 }}>
            By signing up you agree to our <a href="/terms" style={{ color: "rgba(245,240,235,0.8)", textDecoration: "underline" }}>Terms of Service</a> and <a href="/privacy" style={{ color: "rgba(245,240,235,0.8)", textDecoration: "underline" }}>Privacy Policy</a>.
          </p>
        )}
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <main
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#132440",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: "#F5F0EB",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        .auth-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #F5F0EB;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
          appearance: none;
        }
        .auth-input::placeholder { color: rgba(245,240,235,0.3); }
        .auth-input:focus { border-color: ${G}; background: rgba(255,255,255,0.08); }
        .auth-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, ${G}, ${GD});
          color: #132440;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .auth-btn:hover { opacity: 0.9; }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .msg-action { background: none; border: none; padding: 0; color: ${G}; font: inherit; font-weight: 600; text-decoration: underline; cursor: pointer; }
        .tab {
          flex: 1;
          padding: 10px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
      `}</style>

      {/* Logo */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, textDecoration: "none" }}>
        <div style={{ width: 36, height: 36, background: "#4A82C4", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "-0.03em" }}>SW</div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "#F5F0EB", letterSpacing: "-0.02em" }}>StackedWork</span>
      </a>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>

      <a href="/" style={{ marginTop: 24, fontSize: 13, color: "rgba(245,240,235,0.6)", textDecoration: "none" }}>
        ← Back to home
      </a>
    </main>
  );
}
