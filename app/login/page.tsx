"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const G = "#C8E64A";
const GD = "#A8C435";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vyqbhpuqduaugxmhbtbk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWJocHVxZHVhdWd4bWhidGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDQ0MzUsImV4cCI6MjA4ODc4MDQzNX0.wW4uaZJwIvl6TGZYkVZo9EuG2Ek713Y8F4jACuMxwSI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function LoginPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signin" ? "signin" : "signup";
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!username.trim()) throw new Error("Please enter a username.");
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim(), phone: phone.trim(), website: website.trim() } },
        });
        if (signUpError) throw signUpError;

        // Notify Ryan of new signup
        await fetch("/api/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), email, phone: phone.trim(), website: website.trim() }),
        }).catch(() => {});

        // After signup, send them to Stripe checkout
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.url) {
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
              ? "14-day free trial. Credit card required."
              : mode === "signin"
              ? "Sign in to access your StackedWork dashboard."
              : "Enter your email and we'll send you a reset link."}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(245,240,235,0.7)", marginBottom: 6 }}>
                    Username
                  </label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                    required={mode === "signup"}
                    autoComplete="username"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(245,240,235,0.7)", marginBottom: 6 }}>
                    Business Phone
                  </label>
                  <input
                    className="auth-input"
                    type="tel"
                    placeholder="(410) 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(245,240,235,0.7)", marginBottom: 6 }}>
                    Business Website <span style={{ color: "rgba(245,240,235,0.3)", fontWeight: 400 }}>(optional — we'll set up your lead form)</span>
                  </label>
                  <input
                    className="auth-input"
                    type="url"
                    placeholder="https://yourcompany.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    autoComplete="url"
                  />
                </div>
              </>
            )}
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
              By signing up you agree to our Terms of Service and Privacy Policy.
            </p>
          )}
        </div>
      </div>

      <a href="/" style={{ marginTop: 24, fontSize: 13, color: "rgba(245,240,235,0.35)", textDecoration: "none" }}>
        ← Back to home
      </a>
    </div>
  );
}
