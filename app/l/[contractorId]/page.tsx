"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

const G = "#C8E64A";
const GD = "#A8C435";

const JOB_TYPES = [
  ["🚿", "Bathroom", "bathroom"],
  ["🍳", "Kitchen", "kitchen"],
  ["🎨", "Painting", "paint"],
  ["🏡", "Exterior", "exterior"],
  ["🪵", "Deck", "deck"],
  ["⚡", "Electrical", "electrical"],
  ["🔧", "Plumbing", "plumbing"],
  ["❄️", "HVAC", "hvac"],
  ["🏗️", "General", "general"],
  ["🛠️", "Other", "other"],
];

export default function ContractorLeadForm() {
  const params = useParams();
  const contractorId = String(params?.contractorId || "");

  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [jobType, setJobType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!contractorId) {
      setError("Invalid form link.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError("Please enter a phone number or email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractorId,
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          message: message.trim() || null,
          job_type: jobType || null,
          source: "lead_form",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Submission failed");
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#132440", minHeight: "100vh", color: "#F5F0EB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .lf-fade { animation: fadeUp .7s ease forwards; }
        input, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, textarea:focus { outline: 2px solid ${G}; }
      `}</style>

      <div style={{ background: "#0F1D32", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#4A82C4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>SW</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>StackedWork</span>
        </a>
        <a href="/find-contractor" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none", fontWeight: 500 }}>Find a contractor →</a>
      </div>

      <div style={{ padding: "48px 20px 28px", textAlign: "center", maxWidth: 560, margin: "0 auto" }} className="lf-fade">
        <div style={{ display: "inline-block", background: "rgba(200,230,74,0.12)", border: `1px solid ${G}33`, borderRadius: 100, padding: "6px 18px", fontSize: 12, fontWeight: 700, color: G, letterSpacing: "0.06em", marginBottom: 18, fontFamily: "'Space Mono'" }}>
          REQUEST A QUOTE
        </div>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>
          Tell us about your project
        </h1>
        <p style={{ fontSize: 15, color: "rgba(245,240,235,0.65)", lineHeight: 1.7 }}>
          Fill out this form and the contractor will get your message directly — no account needed.
        </p>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto 60px", padding: "0 20px" }} className="lf-fade">
        {step === "success" ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Message sent!</h2>
            <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.7, marginBottom: 24 }}>
              The contractor received your request and will reach out soon.
            </p>
            <button
              onClick={() => {
                setStep("form");
                setName("");
                setPhone("");
                setEmail("");
                setMessage("");
                setJobType("");
              }}
              style={{ background: G, color: "#132440", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
            >
              Submit another
            </button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px 28px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Contact form</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>Takes about a minute.</p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>YOUR NAME *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>PHONE *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-0100" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>EMAIL</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@gmail.com" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 10, letterSpacing: "0.03em" }}>JOB TYPE (optional)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {JOB_TYPES.map(([icon, label, key]) => (
                  <div
                    key={key}
                    onClick={() => setJobType(jobType === key ? "" : key)}
                    style={{
                      padding: "10px 4px",
                      textAlign: "center",
                      border: jobType === key ? `2px solid ${G}` : "1.5px solid #E2E8F0",
                      borderRadius: 10,
                      cursor: "pointer",
                      background: jobType === key ? "rgba(200,230,74,0.1)" : "#FAFBFC",
                      transition: "all .15s",
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: jobType === key ? "#132440" : "#64748B" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>MESSAGE</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what you need — scope, timing, location…"
                rows={4}
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#991B1B" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "15px",
                background: `linear-gradient(135deg, ${G}, ${GD})`,
                color: "#132440",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Sending..." : "Send request →"}
            </button>
            <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 10 }}>
              Your info goes only to this contractor via StackedWork.
            </p>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", paddingBottom: 40, fontSize: 12, color: "rgba(245,240,235,0.35)" }}>
        Powered by <a href="/" style={{ color: G, textDecoration: "none", fontWeight: 600 }}>StackedWork</a>
      </div>
    </div>
  );
}
