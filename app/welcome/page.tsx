"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const G = "#C8E64A";
const GD = "#A8C435";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = "/";
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

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
          You&apos;re in
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
          Welcome to{" "}
          <span style={{ color: G }}>StackedWork</span>
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
          Your 14-day free trial has started. We&apos;ll reach out shortly to get your
          CRM set up. You&apos;ll be live in 48 hours.
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
            { icon: "📧", text: "Check your email for a confirmation receipt" },
            { icon: "📞", text: "Our team will reach out within 24 hours to get you set up" },
            { icon: "🚀", text: "Your dashboard will be live within 48 hours" },
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
          href="/"
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
          Back to Home
        </a>

        <p
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "rgba(245,240,235,0.25)",
            fontFamily: "'Space Mono'",
          }}
        >
          Redirecting in {countdown}s...
        </p>
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
