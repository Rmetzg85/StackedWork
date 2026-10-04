"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { captureFirstTouch, getFirstTouch } from "../lib/first-touch";
import { useFounderOffer } from "../lib/use-founder-offer";
import { trialDays } from "../lib/offer";
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
  const searchParams = useSearchParams();
  const founder = useFounderOffer();
  const initialMode = searchParams.get("mode") === "signin" ? "signin" : "signup";
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hp, setHp] = useState("");

  // Ads may link straight to /login — capture first-touch UTM here too (no-op if already stored).
  useEffect(() => { captureFirstTouch(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        // Honeypot filled = bot. Show the normal confirmation message and create nothing (no auth user, no email).
        if (hp.trim()) {
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

        // First-run flag (same-device fallback; the confirm link's ?firstrun=1 covers other devices).
        try { window.localStorage.setItem("sw_firstrun", "1"); window.localStorage.setItem("sw_signup_email", cleanEmail); } catch { /* ignore */ }

        // No session = email confirmation required. Say so clearly before moving on to start the trial.
        const needsConfirm = !signUpData?.session;
        if (needsConfirm) {
          setSuccess(`Check your email to confirm your account. We sent a confirmation link to ${cleanEmail}. Starting your free trial…`);
        }
        const shownAt = Date.now();

        // Notify Ryan of new signup
        await fetch("/api/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email: cleanEmail, ...firstTouch, [HONEYPOT_FIELD]: hp }),
        }).catch(() => {});

        // After signup, send them to Stripe checkout
        const res = await fetch("/api/checkout", {
          method: "POST",
          // With a session (email confirmation off) the server can link the subscription to this user id.
          headers: {
            "Content-Type": "application/json",
            ...(signUpData?.session?.access_token ? { Authorization: `Bearer ${signUpData.session.access_token}` } : {}),
          },
          body: JSON.stringify({ email: cleanEmail, utm: firstTouch }),
        });
        const data = await res.json();
        if (data.url) {
          // Keep the "check your email" message on screen long enough to read.
          if (needsConfirm) await new Promise(r => setTimeout(r, Math.max(0, 2500 - (Date.now() - shownAt))));
          window.location.href = data.url;
        } else {
          throw new Error(data.error || "Checkout failed");
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
      setError(err.message || "Something went wrong. Please try again.");
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
            onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
            style={{
              color: mode === "signup" ? G : "rgba(245,240,235,0.4)",
              borderBottomColor: mode === "signup" ? G : "transparent",
            }}
          >
            Sign Up
          </button>
          <button
            className="tab"
            onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
            style={{
              color: mode === "signin" ? G : "rgba(245,240,235,0.4)",
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
        <p style={{ fontSize: 13, color: "rgba(245,240,235,0.45)", marginBottom: 24 }}>
          {mode === "signup"
            ? `No credit card required · ${trialDays(founder)}-day free trial · cancel anytime`
            : mode === "signin"
            ? "Sign in to access your StackedWork dashboard."
            : "Enter your email and we'll send you a reset link."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
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
                  placeholder={mode === "signup" ? "Create a password (min 6 chars)" : "Your password"}
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
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(245,240,235,0.45)",
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
                onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                style={{ fontSize: 12, color: G, cursor: "pointer", fontWeight: 500 }}
              >
                Forgot password?
              </span>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#FCA5A5" }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: "10px 14px", background: "rgba(200,230,74,0.1)", border: "1px solid rgba(200,230,74,0.3)", borderRadius: 8, fontSize: 13, color: G }}>
              {success}
            </div>
          )}

          <button className="auth-btn" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? (mode === "signup" ? "Creating account..." : mode === "signin" ? "Signing in..." : "Sending...")
              : (mode === "signup" ? "Create Account & Start Trial" : mode === "signin" ? "Sign In" : "Send Reset Link")}
          </button>
        </form>

        {mode === "forgot" && (
          <p style={{ marginTop: 18, fontSize: 13, color: "rgba(245,240,235,0.35)", textAlign: "center" }}>
            <span
              onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
              style={{ color: G, cursor: "pointer", fontWeight: 500 }}
            >
              ← Back to sign in
            </span>
          </p>
        )}

        {mode === "signup" && (
          <p style={{ marginTop: 18, fontSize: 11, color: "rgba(245,240,235,0.25)", textAlign: "center", lineHeight: 1.5 }}>
            By signing up you agree to our <a href="/terms" style={{ color: "rgba(245,240,235,0.45)" }}>Terms of Service</a> and <a href="/privacy" style={{ color: "rgba(245,240,235,0.45)" }}>Privacy Policy</a>.
          </p>
        )}
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div
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

      <a href="/" style={{ marginTop: 24, fontSize: 13, color: "rgba(245,240,235,0.35)", textDecoration: "none" }}>
        ← Back to home
      </a>
    </div>
  );
}
