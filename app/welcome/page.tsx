"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TRIAL_DAYS } from "../lib/offer";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";

const G = "#C8E64A";
const GD = "#A8C435";

function WelcomeContent() {
  // Works with or without a card on the Stripe session: this page never reads
  // payment details. session_id is kept in the URL only for reference.
  const searchParams = useSearchParams();
  void searchParams.get("session_id");
  // Set by /api/checkout only on the (dormant) founder path. That trial length differs, so it's left unnumbered here
  // (never shows the founder length on a hand-typed ?offer=founder URL while the offer is off).
  const founderTrial = searchParams.get("offer") === "founder";
  const [checking, setChecking] = useState(true);
  const [signupEmail, setSignupEmail] = useState<string | null>(null);

  useEffect(() => {
    // Signed in already (email confirmation off) → go straight to the first-run
    // "Log your first job by voice" screen. Otherwise ask them to confirm email;
    // the confirmation link (or their first sign-in) opens the same screen.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) { setChecking(false); return; }
    try { setSignupEmail(window.localStorage.getItem("sw_signup_email")); } catch { /* ignore */ }
    const supabase = createClient(url, key, { auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true } });
    supabase.auth.getSession()
      .then(({ data }) => {
        if (data.session) window.location.replace("/?firstrun=1");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

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
        textAlign: "center",
        color: "#F5F0EB",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        @keyframes popIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .check-anim{animation:popIn .6s ease forwards}
        .content-anim{animation:fadeUp .6s ease .3s forwards;opacity:0}
      `}</style>

      <div
        className="check-anim"
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${G}, ${GD})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          marginBottom: 28,
          boxShadow: `0 0 40px rgba(200,230,74,0.3)`,
        }}
      >
        ✓
      </div>

      <div className="content-anim">
        <div
          style={{
            fontFamily: "'Space Mono'",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: G,
            marginBottom: 14,
          }}
        >
          {checking ? "You\u2019re in" : "One more step"}
        </div>
        <h1
          style={{
            fontSize: "clamp(30px, 5vw, 52px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            marginBottom: 16,
            lineHeight: 1.1,
          }}
        >
          {checking
            ? <>Welcome to{" "}<span style={{ color: G }}>StackedWork</span></>
            : <>Check your email to <span style={{ color: G }}>confirm your account</span></>}
        </h1>
        <p
          style={{
            fontSize: 17,
            color: "rgba(245,240,235,0.6)",
            maxWidth: 500,
            margin: "0 auto 36px",
            lineHeight: 1.7,
          }}
        >
          {checking
            ? "Opening your dashboard…"
            : <>We sent a confirmation link to <strong style={{ color: "#F5F0EB" }}>{signupEmail || "the email you signed up with"}</strong>. Tap it to open StackedWork. It works on any device. Your {founderTrial ? "" : `${TRIAL_DAYS}-day `}free trial has started (no credit card on file), and the link takes you straight to <strong style={{ color: G }}>log your first job by voice</strong>.</>}
        </p>

        <div
          style={{
            background: "rgba(200,230,74,0.08)",
            border: "1px solid rgba(200,230,74,0.2)",
            borderRadius: 12,
            padding: "24px 32px",
            maxWidth: 420,
            margin: "0 auto 36px",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Mono'",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(245,240,235,0.4)",
              marginBottom: 16,
            }}
          >
            What happens next
          </div>
          {[
            { icon: "📧", text: "Open the confirmation email we just sent and tap the link" },
            { icon: "🎤", text: "You'll land on \u201cLog your first job by voice\u201d \u2014 or type it instead" },
            { icon: "🚀", text: "Your dashboard is ready right away — no setup call needed" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: i < 2 ? 14 : 0,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: "rgba(245,240,235,0.7)", lineHeight: 1.5 }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>

        <a
          href="/login?mode=signin"
          style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${G}, ${GD})`,
            color: "#132440",
            padding: "14px 32px",
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          I&apos;ve confirmed — sign in
        </a>

      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense>
      <WelcomeContent />
    </Suspense>
  );
}
