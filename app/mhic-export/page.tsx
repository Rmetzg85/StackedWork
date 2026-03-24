"use client";
import { useState } from "react";

const G = "#C8E64A";
const GD = "#A8C435";

export default function MHICExportPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/mhic-export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `maryland-contractors-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
    } catch (err: any) {
      setError(err.message || "Export failed");
      setStatus("error");
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#132440", minHeight: "100vh", color: "#F5F0EB", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,700&family=Space+Mono:wght@700&display=swap'); *{margin:0;padding:0;box-sizing:border-box;}`}</style>

      <div style={{ maxWidth: 480, width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, padding: "40px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Maryland Contractor Export</h1>
        <p style={{ fontSize: 14, color: "rgba(245,240,235,0.5)", lineHeight: 1.7, marginBottom: 32 }}>
          Pulls all active licensed contractors from the Maryland MHIC database across all 23 counties and Baltimore City. Downloads as a CSV ready for outreach.
        </p>

        <div style={{ background: "rgba(200,230,74,0.07)", border: "1px solid rgba(200,230,74,0.15)", borderRadius: 12, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G, fontFamily: "'Space Mono'", letterSpacing: "0.06em", marginBottom: 10 }}>CSV INCLUDES</div>
          {["License number", "Contractor name", "Trade / business name", "City", "County", "License status (Active / Inactive)"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 5 ? 6 : 0 }}>
              <span style={{ color: G, fontSize: 12 }}>✓</span>
              <span style={{ fontSize: 13, color: "rgba(245,240,235,0.65)" }}>{f}</span>
            </div>
          ))}
        </div>

        {status === "loading" && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(200,230,74,0.08)", border: "1px solid rgba(200,230,74,0.2)", borderRadius: 10, fontSize: 13, color: G }}>
            Querying MHIC across all counties... this takes ~30–45 seconds.
          </div>
        )}

        {status === "done" && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, fontSize: 13, color: "#4ADE80" }}>
            Download started! Check your downloads folder.
          </div>
        )}

        {status === "error" && error && (
          <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, fontSize: 13, color: "#FCA5A5" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={status === "loading"}
          style={{ width: "100%", padding: "14px", background: status === "loading" ? "rgba(200,230,74,0.3)" : `linear-gradient(135deg, ${G}, ${GD})`, color: "#132440", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: status === "loading" ? "not-allowed" : "pointer" }}
        >
          {status === "loading" ? "Pulling data…" : "Download Maryland Contractors CSV →"}
        </button>

        <p style={{ fontSize: 11, color: "rgba(245,240,235,0.25)", marginTop: 14 }}>
          Data sourced from the official Maryland DLLR / MHIC public database.
        </p>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ fontSize: 12, color: "rgba(245,240,235,0.35)", lineHeight: 1.6 }}>
            Next step: Run the list through <strong style={{ color: "rgba(245,240,235,0.55)" }}>Hunter.io</strong> or <strong style={{ color: "rgba(245,240,235,0.55)" }}>Apollo.io</strong> to append emails, then import into <strong style={{ color: "rgba(245,240,235,0.55)" }}>Instantly.ai</strong> for outreach.
          </p>
        </div>
      </div>
    </div>
  );
}
