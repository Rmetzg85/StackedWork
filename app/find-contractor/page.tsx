"use client";
import { useState } from "react";

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

export default function FindContractor() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [jobType, setJobType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MHIC verification
  const [mhicZip, setMhicZip] = useState("");
  const [mhicName, setMhicName] = useState("");
  const [mhicResults, setMhicResults] = useState<any[] | null>(null);
  const [mhicLoading, setMhicLoading] = useState(false);
  const [mhicError, setMhicError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || (!phone.trim() && !email.trim()) || !jobType || !zip.trim()) {
      setError("Please fill in your name, contact info, zip code, and job type.");
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/homeowner-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, zip_code: zip, job_type: jobType, description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Submission failed");
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMHICLookup = async () => {
    if (!mhicZip.trim() && !mhicName.trim()) {
      setMhicError("Enter a zip code or contractor name to search.");
      return;
    }
    setMhicLoading(true); setMhicError(null); setMhicResults(null);
    try {
      const params = new URLSearchParams();
      if (mhicZip.trim()) params.set("zip", mhicZip.trim());
      else params.set("name", mhicName.trim());
      const res = await fetch(`/api/mhic-lookup?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMhicResults(data.contractors || []);
    } catch (err: any) {
      setMhicError(err.message || "Lookup failed. Please try again.");
    } finally {
      setMhicLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#132440", minHeight: "100vh", color: "#F5F0EB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        .fc-fade { animation: fadeUp .7s ease forwards; }
        .fc-fade1 { animation: fadeUp .7s ease .1s forwards; opacity:0; }
        .fc-fade2 { animation: fadeUp .7s ease .2s forwards; opacity:0; }
        input, textarea, select { font-family: 'DM Sans', sans-serif; }
        input:focus, textarea:focus { outline: 2px solid ${G}; }
      `}</style>

      {/* Nav */}
      <div style={{ background: "#0F1D32", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#4A82C4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>SW</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>StackedWork</span>
        </a>
        <a href="/" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none", fontWeight: 500 }}>Are you a contractor? →</a>
      </div>

      {/* Hero */}
      <div style={{ padding: "60px 20px 40px", textAlign: "center", maxWidth: 680, margin: "0 auto" }} className="fc-fade">
        <div style={{ display: "inline-block", background: "rgba(200,230,74,0.12)", border: `1px solid ${G}33`, borderRadius: 100, padding: "6px 18px", fontSize: 12, fontWeight: 700, color: G, letterSpacing: "0.06em", marginBottom: 20, fontFamily: "'Space Mono'" }}>
          MARYLAND LICENSED CONTRACTORS
        </div>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
          Get Free Quotes from<br />
          <span style={{ color: G }}>Licensed Maryland Contractors</span>
        </h1>
        <p style={{ fontSize: 17, color: "rgba(245,240,235,0.65)", lineHeight: 1.7, marginBottom: 8 }}>
          Tell us about your project. We connect you with MHIC-licensed contractors in your area — verified, insured, and ready to work.
        </p>
        <p style={{ fontSize: 13, color: "rgba(245,240,235,0.4)" }}>Free service · No obligation · Maryland only</p>
      </div>

      {/* Main card */}
      <div style={{ maxWidth: 600, margin: "0 auto 60px", padding: "0 20px" }} className="fc-fade1">
        {step === "success" ? (
          <div style={{ background: "#fff", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginBottom: 10 }}>Request Received!</h2>
            <p style={{ fontSize: 15, color: "#64748B", lineHeight: 1.7, marginBottom: 24 }}>
              Licensed contractors in your area will reach out to you shortly. You&apos;ll hear back within 24 hours.
            </p>
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: "0.05em" }}>WHAT HAPPENS NEXT</div>
              {["Licensed contractors in your zip code see your request", "They reach out directly by phone or email", "You compare quotes and choose who you want"].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#132440", flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setStep("form"); setName(""); setPhone(""); setEmail(""); setZip(""); setJobType(""); setDescription(""); }} style={{ background: G, color: "#132440", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Submit Another Request
            </button>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 20, padding: "32px 28px" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginBottom: 4 }}>Describe Your Project</h2>
            <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>Takes 60 seconds. No account needed.</p>

            {/* Job type */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 10, letterSpacing: "0.03em" }}>JOB TYPE *</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {JOB_TYPES.map(([icon, label, key]) => (
                  <div key={key} onClick={() => setJobType(key)} style={{ padding: "10px 4px", textAlign: "center", border: jobType === key ? `2px solid ${G}` : "1.5px solid #E2E8F0", borderRadius: 10, cursor: "pointer", background: jobType === key ? "rgba(200,230,74,0.1)" : "#FAFBFC", transition: "all .15s" }}>
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: jobType === key ? "#132440" : "#64748B" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>PROJECT DETAILS</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you need done — size, scope, any specific requirements..." rows={3} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
            </div>

            {/* Name + Zip */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>YOUR NAME *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>ZIP CODE *</label>
                <input value={zip} onChange={e => setZip(e.target.value)} placeholder="21201" maxLength={5} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Phone + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>PHONE *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(410) 555-0100" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>EMAIL</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@gmail.com" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>

            {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, fontSize: 13, color: "#991B1B" }}>{error}</div>}

            <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "15px", background: `linear-gradient(135deg, ${G}, ${GD})`, color: "#132440", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Submitting..." : "Get Free Quotes →"}
            </button>
            <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 10 }}>
              By submitting you agree to be contacted by licensed Maryland contractors. No spam.
            </p>
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{ background: "#0F1D32", padding: "60px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>How It Works</h2>
          <p style={{ fontSize: 14, color: "rgba(245,240,235,0.5)", textAlign: "center", marginBottom: 40 }}>Simple, fast, and completely free for homeowners.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
            {[
              { n: "01", t: "Describe your project", d: "Tell us what needs to be done, your zip code, and how to reach you." },
              { n: "02", t: "We match you instantly", d: "Your request goes live to MHIC-licensed contractors in your area." },
              { n: "03", t: "Contractors reach out", d: "Compare quotes, check reviews, and hire who you trust." },
            ].map((x, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "24px 20px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ fontFamily: "'Space Mono'", fontSize: 11, color: G, fontWeight: 700, marginBottom: 12, letterSpacing: "0.05em" }}>{x.n}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{x.t}</div>
                <div style={{ fontSize: 13, color: "rgba(245,240,235,0.5)", lineHeight: 1.6 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MHIC Verification */}
      <div style={{ padding: "60px 20px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: "32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Verify an MHIC License</h3>
          </div>
          <p style={{ fontSize: 13, color: "rgba(245,240,235,0.5)", marginBottom: 20, lineHeight: 1.6 }}>
            Already found a contractor? Search the Maryland Home Improvement Commission database to confirm they&apos;re licensed.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <input value={mhicZip} onChange={e => setMhicZip(e.target.value)} placeholder="Zip code (e.g. 21201)" maxLength={5} style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
            <input value={mhicName} onChange={e => setMhicName(e.target.value)} placeholder="Or contractor last name" style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <button onClick={handleMHICLookup} disabled={mhicLoading} style={{ width: "100%", padding: "12px", background: G, color: "#132440", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: mhicLoading ? "not-allowed" : "pointer", opacity: mhicLoading ? 0.7 : 1 }}>
            {mhicLoading ? "Searching MHIC Database..." : "Search Maryland MHIC Database"}
          </button>
          {mhicError && <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#FCA5A5" }}>{mhicError}</div>}
          {mhicResults !== null && (
            <div style={{ marginTop: 16 }}>
              {mhicResults.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: "rgba(245,240,235,0.5)", fontSize: 13 }}>No licensed contractors found for that search.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                  {mhicResults.map((c, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}{c.trade_name ? ` · ${c.trade_name}` : ""}</div>
                          <div style={{ fontSize: 11, color: "rgba(245,240,235,0.45)", marginTop: 2 }}>{[c.city, c.county].filter(Boolean).join(", ")}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontFamily: "'Space Mono'", color: G }}>{c.license}</div>
                          <div style={{ fontSize: 10, color: c.status?.toLowerCase() === "active" ? "#4ADE80" : "#94A3B8", marginTop: 2, fontWeight: 600 }}>{c.status}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <p style={{ fontSize: 11, color: "rgba(245,240,235,0.3)", marginTop: 12, textAlign: "center" }}>
            Data sourced from the Maryland Dept. of Labor MHIC public database.
          </p>
        </div>
      </div>

      {/* Contractor CTA */}
      <div style={{ background: `linear-gradient(135deg, #0F1D32, #1a2d48)`, borderTop: "1px solid rgba(255,255,255,0.07)", padding: "60px 20px", textAlign: "center" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Are You a Licensed Contractor?</h2>
        <p style={{ fontSize: 15, color: "rgba(245,240,235,0.55)", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>
          Get notified the moment a homeowner in your area submits a project. StackedWork manages your leads, jobs, and revenue — all in one place.
        </p>
        <a href="/" style={{ display: "inline-block", background: `linear-gradient(135deg, ${G}, ${GD})`, color: "#132440", textDecoration: "none", padding: "14px 36px", borderRadius: 10, fontSize: 15, fontWeight: 800 }}>
          Join StackedWork →
        </a>
        <p style={{ fontSize: 12, color: "rgba(245,240,235,0.3)", marginTop: 14 }}>$49.99/month · 14-day free trial · No contracts</p>
      </div>
    </div>
  );
}
