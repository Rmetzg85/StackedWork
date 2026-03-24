"use client";
import { useState } from "react";
import ChatWidget from "../components/ChatWidget";

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

  // License verification
  const [verifyZip, setVerifyZip] = useState("");
  const [verifyName, setVerifyName] = useState("");
  const [verifyResults, setVerifyResults] = useState<any | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

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

  const handleVerify = async () => {
    if (!verifyZip.trim() && !verifyName.trim()) {
      setVerifyError("Enter a zip code or contractor name to search.");
      return;
    }
    setVerifyLoading(true); setVerifyError(null); setVerifyResults(null);
    try {
      const params = new URLSearchParams();
      if (verifyZip.trim()) params.set("zip", verifyZip.trim());
      if (verifyName.trim()) params.set("name", verifyName.trim());
      const res = await fetch(`/api/license-lookup?${params}`);
      const data = await res.json();
      if (data.error && !data.supported) throw new Error(data.error);
      setVerifyResults(data);
    } catch (err: any) {
      setVerifyError(err.message || "Lookup failed. Please try again.");
    } finally {
      setVerifyLoading(false);
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
          LICENSED CONTRACTORS — ALL 50 STATES
        </div>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
          Get Free Quotes from<br />
          <span style={{ color: G }}>Licensed Contractors Near You</span>
        </h1>
        <p style={{ fontSize: 17, color: "rgba(245,240,235,0.65)", lineHeight: 1.7, marginBottom: 8 }}>
          Tell us about your project and your zip code. We connect you with state-licensed contractors in your area — verified, insured, and ready to work.
        </p>
        <p style={{ fontSize: 13, color: "rgba(245,240,235,0.4)" }}>Free service · No obligation · All 50 states</p>
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
                <input value={zip} onChange={e => setZip(e.target.value)} placeholder="Enter zip code" maxLength={5} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Phone + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, letterSpacing: "0.03em" }}>PHONE *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-0100" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E2E8F0", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
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
              By submitting you agree to be contacted by licensed contractors. No spam.
            </p>
          </div>
        )}
      </div>

      {/* LetsStayStacked Featured Ad Space */}
      <div style={{ padding: "0 20px 60px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(200,230,74,0.25)", background: "linear-gradient(135deg, rgba(200,230,74,0.07), rgba(74,130,196,0.07))" }}>
          <div style={{ background: "rgba(200,230,74,0.1)", borderBottom: "1px solid rgba(200,230,74,0.2)", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: G, fontFamily: "'Space Mono'", letterSpacing: "0.1em" }}>LETSTAYSTACKED FEATURED</span>
            <span style={{ fontSize: 10, color: "rgba(245,240,235,0.3)", fontFamily: "'Space Mono'" }}>· SPONSORED</span>
          </div>
          <div style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🏗️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Your Business Here</div>
            <p style={{ fontSize: 13, color: "rgba(245,240,235,0.5)", lineHeight: 1.6, marginBottom: 18, maxWidth: 360, margin: "0 auto 18px" }}>
              Get your contracting business seen by homeowners actively looking for your trade. Featured placement on this page.
            </p>
            <a href="/advertise" style={{ display: "inline-block", background: `linear-gradient(135deg, ${G}, ${GD})`, color: "#132440", textDecoration: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              Get Featured → $49.99/mo
            </a>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: "#0F1D32", padding: "60px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>How It Works</h2>
          <p style={{ fontSize: 14, color: "rgba(245,240,235,0.5)", textAlign: "center", marginBottom: 40 }}>Simple, fast, and completely free for homeowners.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
            {[
              { n: "01", t: "Describe your project", d: "Tell us what needs to be done, your zip code, and how to reach you." },
              { n: "02", t: "We match you instantly", d: "Your request goes live to state-licensed contractors in your area." },
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

      {/* License Verification — national */}
      <div style={{ padding: "60px 20px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 16, padding: "32px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>🔍</span>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Verify a Contractor License</h3>
          </div>
          <p style={{ fontSize: 13, color: "rgba(245,240,235,0.5)", marginBottom: 20, lineHeight: 1.6 }}>
            Already found a contractor? Enter their zip code or name to check their license with your state&apos;s licensing board.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <input value={verifyZip} onChange={e => setVerifyZip(e.target.value)} placeholder="Contractor zip code" maxLength={5} style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
            <input value={verifyName} onChange={e => setVerifyName(e.target.value)} placeholder="Or contractor last name" style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
          </div>
          <button onClick={handleVerify} disabled={verifyLoading} style={{ width: "100%", padding: "12px", background: G, color: "#132440", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: verifyLoading ? "not-allowed" : "pointer", opacity: verifyLoading ? 0.7 : 1 }}>
            {verifyLoading ? "Searching..." : "Verify License"}
          </button>

          {verifyError && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#FCA5A5" }}>{verifyError}</div>
          )}

          {verifyResults && (
            <div style={{ marginTop: 16 }}>
              {/* Unsupported state — show official link */}
              {!verifyResults.supported && verifyResults.lookupUrl && (
                <div style={{ background: "rgba(200,230,74,0.08)", border: "1px solid rgba(200,230,74,0.2)", borderRadius: 12, padding: "20px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {verifyResults.stateName ? `${verifyResults.stateName} — ${verifyResults.agencyName}` : "Official State Database"}
                  </div>
                  {verifyResults.notes && (
                    <p style={{ fontSize: 12, color: "rgba(245,240,235,0.5)", marginBottom: 10, lineHeight: 1.5 }}>{verifyResults.notes}</p>
                  )}
                  <p style={{ fontSize: 13, color: "rgba(245,240,235,0.6)", marginBottom: 14, lineHeight: 1.5 }}>
                    Automated lookup for this state is coming soon. Verify the license directly on the official state database:
                  </p>
                  <a href={verifyResults.lookupUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", background: G, color: "#132440", textDecoration: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                    Verify on {verifyResults.agencyName || "State Database"} →
                  </a>
                </div>
              )}

              {/* Supported state — show inline results */}
              {verifyResults.supported && (
                <>
                  {verifyResults.contractors?.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 20, color: "rgba(245,240,235,0.5)", fontSize: 13 }}>
                      No licensed contractors found. Try the {" "}
                      <a href={verifyResults.lookupUrl} target="_blank" rel="noopener noreferrer" style={{ color: G }}>
                        official {verifyResults.agencyName} database
                      </a>.
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: "rgba(245,240,235,0.4)", marginBottom: 10 }}>
                        {verifyResults.contractors.length} result{verifyResults.contractors.length !== 1 ? "s" : ""} from {verifyResults.agencyName}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                        {verifyResults.contractors.map((c: any, i: number) => (
                          <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}{c.trade_name ? ` · ${c.trade_name}` : ""}</div>
                                <div style={{ fontSize: 11, color: "rgba(245,240,235,0.45)", marginTop: 2 }}>{[c.city, c.county, c.state].filter(Boolean).join(", ")}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 11, fontFamily: "'Space Mono'", color: G }}>{c.license}</div>
                                <div style={{ fontSize: 10, color: c.status?.toLowerCase() === "active" ? "#4ADE80" : "#94A3B8", marginTop: 2, fontWeight: 600 }}>{c.status}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          <p style={{ fontSize: 11, color: "rgba(245,240,235,0.3)", marginTop: 16, textAlign: "center" }}>
            Data sourced directly from official state licensing boards. Currently live for MD and MA. More states added regularly.
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
      <ChatWidget mode="homeowner" />
    </div>
  );
}
