"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vyqbhpuqduaugxmhbtbk.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5cWJocHVxZHVhdWd4bWhidGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDQ0MzUsImV4cCI6MjA4ODc4MDQzNX0.wW4uaZJwIvl6TGZYkVZo9EuG2Ek713Y8F4jACuMxwSI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const G = "#C8E64A";
const GD = "#A8C435";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash; getSession picks it up automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
      setChecking(false);
    });

    // Also listen for the AUTH event fired when the hash token is exchanged
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidSession(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); }
    else { setSuccess(true); setLoading(false); }
  };

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#132440", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');*{margin:0;padding:0;box-sizing:border-box}`}</style>
      <div style={{ background: "#fff", borderRadius: 16, padding: 36, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "#4A82C4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", margin: "0 auto 12px" }}>SW</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Set new password</h2>
          <p style={{ fontSize: 13, color: "#64748B" }}>Enter a new password for your StackedWork account</p>
        </div>

        {checking ? (
          <p style={{ textAlign: "center", color: "#64748B", fontSize: 14 }}>Verifying link...</p>
        ) : success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "#D1FAE5", border: "1px solid #6EE7B7", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <p style={{ fontSize: 14, color: "#065F46", fontWeight: 500 }}>Password updated! You can now sign in.</p>
            </div>
            <a href="/" style={{ display: "inline-block", padding: "12px 28px", background: `linear-gradient(135deg,${G},${GD})`, color: "#132440", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Go to Sign In</a>
          </div>
        ) : !validSession ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: "#991B1B", fontWeight: 500 }}>This reset link is invalid or has expired.</p>
            </div>
            <a href="/" style={{ display: "inline-block", padding: "12px 28px", background: `linear-gradient(135deg,${G},${GD})`, color: "#132440", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>Request a new link</a>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans'", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans'", outline: "none", boxSizing: "border-box" }} />
            </div>
            {error && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#991B1B" }}>{error}</div>}
            <button onClick={handleReset} disabled={loading} style={{ width: "100%", padding: 12, background: `linear-gradient(135deg,${G},${GD})`, color: "#132440", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans'", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
