import type { ReactNode } from "react";

// Shared, plain layout for /privacy and /terms (server component, no client JS).
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", background: "#132440", minHeight: "100vh", color: "#F5F0EB" }}>
      <style>{`
        .legal h2{font-size:19px;font-weight:700;margin:32px 0 10px;color:#fff}
        .legal p,.legal li{font-size:15px;line-height:1.7;color:rgba(245,240,235,0.78)}
        .legal ul{padding-left:22px;margin:8px 0}
        .legal li{margin-bottom:6px}
        .legal a{color:#C8E64A}
        .legal strong{color:#fff}
      `}</style>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 22px 80px" }}>
        <a href="/" style={{ color: "#C8E64A", fontSize: 14, textDecoration: "none" }}>← Back to StackedWork</a>
        <h1 style={{ fontSize: 30, fontWeight: 800, margin: "22px 0 6px", color: "#fff" }}>{title}</h1>
        <p style={{ fontSize: 13, color: "rgba(245,240,235,0.45)", marginBottom: 12 }}>Last updated: {updated}</p>
        <div className="legal">{children}</div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 40, paddingTop: 18, fontSize: 13, color: "rgba(245,240,235,0.45)", display: "flex", gap: 18, flexWrap: "wrap" }}>
          <span>StackedWork, a REM Ventures product</span>
          <a href="/privacy" style={{ color: "rgba(245,240,235,0.6)" }}>Privacy Policy</a>
          <a href="/terms" style={{ color: "rgba(245,240,235,0.6)" }}>Terms of Service</a>
          <a href="mailto:ryan@remventures.tech" style={{ color: "rgba(245,240,235,0.6)" }}>ryan@remventures.tech</a>
        </div>
      </div>
    </div>
  );
}
