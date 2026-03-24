"use client";
import { useState } from "react";

const G = "#C8E64A";
const GD = "#A8C435";

const PLANS = [
  {
    id: "basic",
    name: "Basic Placement",
    price: "$49.99",
    period: "/mo",
    badge: null,
    features: [
      "Listed on the Find a Contractor page",
      "Your business name, trade & zip shown to homeowners",
      "Appears to homeowners searching your trade",
      "Cancel anytime",
    ],
    cta: "Get Started",
  },
  {
    id: "featured",
    name: "Featured Spot",
    price: "$99.99",
    period: "/mo",
    badge: "MOST POPULAR",
    features: [
      "Everything in Basic",
      "Top-of-page featured banner placement",
      "Bold highlighted listing",
      "Logo + business photo shown",
      "Priority lead notifications via SMS",
    ],
    cta: "Get Featured",
  },
  {
    id: "exclusive",
    name: "Exclusive Zip",
    price: "$199.99",
    period: "/mo",
    badge: "BEST VALUE",
    features: [
      "Everything in Featured",
      "Exclusive ad slot — no competitors in your zip",
      "Dedicated call-to-action button on page",
      "Monthly performance report",
    ],
    cta: "Lock My Zip",
  },
];

const TRADES = [
  "Bathroom Remodel", "Kitchen Remodel", "Painting", "Exterior / Siding",
  "Deck / Patio", "Electrical", "Plumbing", "HVAC", "General Contracting", "Other",
];

export default function AdvertisePage() {
  const [selectedPlan, setSelectedPlan] = useState("featured");
  const [step, setStep] = useState<"plans" | "form" | "success">("plans");

  // Form state
  const [bizName, setBizName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [trade, setTrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosenPlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];

  const handleStartForm = (planId: string) => {
    setSelectedPlan(planId);
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!bizName.trim() || !contactName.trim() || !phone.trim() || !email.trim() || !zip.trim() || !trade) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Forward to main sign-up / checkout
      const params = new URLSearchParams({
        plan: selectedPlan,
        biz: bizName,
        contact: contactName,
        phone,
        email,
        zip,
        trade,
        source: "advertise",
      });
      window.location.href = `/login?${params.toString()}`;
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#132440", minHeight: "100vh", color: "#F5F0EB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation: fadeUp .6s ease forwards; }
        .fade1 { animation: fadeUp .6s ease .1s forwards; opacity:0; }
        .fade2 { animation: fadeUp .6s ease .2s forwards; opacity:0; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { outline: 2px solid ${G}; }
        .plan-card:hover { transform: translateY(-3px); }
      `}</style>

      {/* Nav */}
      <div style={{ background: "#0F1D32", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#4A82C4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>SW</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>StackedWork</span>
        </a>
        <a href="/find-contractor" style={{ fontSize: 13, color: "#94A3B8", textDecoration: "none", fontWeight: 500 }}>See the homeowner page →</a>
      </div>

      {step === "success" ? (
        <div style={{ maxWidth: 540, margin: "80px auto", padding: "0 20px", textAlign: "center" }} className="fade">
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>You're in!</h2>
          <p style={{ fontSize: 15, color: "rgba(245,240,235,0.6)", lineHeight: 1.7, marginBottom: 28 }}>
            We received your info. Our team will set up your ad placement and reach out within one business day.
          </p>
          <a href="/find-contractor" style={{ display: "inline-block", background: `linear-gradient(135deg, ${G}, ${GD})`, color: "#132440", textDecoration: "none", padding: "13px 32px", borderRadius: 10, fontSize: 14, fontWeight: 800 }}>
            See the homeowner page →
          </a>
        </div>
      ) : step === "form" ? (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "50px 20px 80px" }} className="fade">
          {/* Back */}
          <button onClick={() => setStep("plans")} style={{ background: "none", border: "none", color: "rgba(245,240,235,0.5)", fontSize: 13, cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>
            ← Back to plans
          </button>

          {/* Selected plan badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,230,74,0.12)", border: `1px solid ${G}33`, borderRadius: 100, padding: "6px 18px", fontSize: 12, fontWeight: 700, color: G, letterSpacing: "0.05em", marginBottom: 20, fontFamily: "'Space Mono'" }}>
            {chosenPlan.name.toUpperCase()} — {chosenPlan.price}{chosenPlan.period}
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Tell us about your business</h1>
          <p style={{ fontSize: 14, color: "rgba(245,240,235,0.5)", marginBottom: 32, lineHeight: 1.6 }}>
            Fill this out and we'll get your ad live within one business day.
          </p>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Biz name */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>BUSINESS NAME *</label>
              <input value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Ace Roofing & Remodeling" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14 }} />
            </div>

            {/* Trade */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>YOUR TRADE *</label>
              <select value={trade} onChange={e => setTrade(e.target.value)} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.12)", background: "#1a2d48", color: trade ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 14 }}>
                <option value="" disabled>Select your primary trade…</option>
                {TRADES.map(t => <option key={t} value={t} style={{ color: "#fff" }}>{t}</option>)}
              </select>
            </div>

            {/* Zip */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>SERVICE ZIP CODE *</label>
              <input value={zip} onChange={e => setZip(e.target.value)} placeholder="21201" maxLength={5} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14 }} />
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

            {/* Contact */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>YOUR NAME *</label>
                <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Smith" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>PHONE *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-0100" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14 }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 6, letterSpacing: "0.04em" }}>EMAIL *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@aceroofing.com" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14 }} />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#FCA5A5" }}>{error}</div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "15px", background: `linear-gradient(135deg, ${G}, ${GD})`, color: "#132440", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
              {loading ? "Submitting…" : `Start ${chosenPlan.name} →`}
            </button>
            <p style={{ fontSize: 11, color: "rgba(245,240,235,0.3)", textAlign: "center" }}>
              No charge today. We'll confirm your placement details before billing.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div style={{ padding: "64px 20px 48px", textAlign: "center", maxWidth: 720, margin: "0 auto" }} className="fade">
            <div style={{ display: "inline-block", background: "rgba(200,230,74,0.12)", border: `1px solid ${G}33`, borderRadius: 100, padding: "6px 18px", fontSize: 12, fontWeight: 700, color: G, letterSpacing: "0.06em", marginBottom: 20, fontFamily: "'Space Mono'" }}>
              ADVERTISE ON STACKEDWORK
            </div>
            <h1 style={{ fontSize: "clamp(28px, 6vw, 50px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 18 }}>
              Get Your Business in Front of<br />
              <span style={{ color: G }}>Homeowners Ready to Hire</span>
            </h1>
            <p style={{ fontSize: 17, color: "rgba(245,240,235,0.65)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 10px" }}>
              StackedWork's homeowner page connects people with licensed contractors in their area — get a featured placement and be the first business they see.
            </p>
            <p style={{ fontSize: 13, color: "rgba(245,240,235,0.35)" }}>No long-term contracts · Live within 24 hours · Cancel anytime</p>
          </div>

          {/* Stats bar */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "24px 20px", marginBottom: 60 }} className="fade1">
            <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, textAlign: "center" }}>
              {[
                { n: "10 Trades", d: "Bathroom, Kitchen, Electrical, Plumbing & more" },
                { n: "All 50 States", d: "Homeowners searching from every state" },
                { n: "Live Leads", d: "Real homeowners with real projects, right now" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 15, fontWeight: 700, color: G, marginBottom: 4 }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: "rgba(245,240,235,0.45)", lineHeight: 1.5 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plans */}
          <div style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 20px" }} className="fade2">
            <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Choose Your Ad Placement</h2>
            <p style={{ fontSize: 14, color: "rgba(245,240,235,0.45)", textAlign: "center", marginBottom: 36 }}>All plans put your business directly in front of homeowners searching for your trade.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              {PLANS.map((plan) => {
                const active = selectedPlan === plan.id;
                return (
                  <div key={plan.id} className="plan-card" onClick={() => setSelectedPlan(plan.id)} style={{ borderRadius: 18, border: active ? `2px solid ${G}` : "1.5px solid rgba(255,255,255,0.1)", background: active ? "rgba(200,230,74,0.07)" : "rgba(255,255,255,0.03)", padding: "28px 24px", cursor: "pointer", transition: "all .2s", position: "relative" }}>
                    {plan.badge && (
                      <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: G, color: "#132440", borderRadius: 100, padding: "3px 14px", fontSize: 10, fontWeight: 800, fontFamily: "'Space Mono'", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                        {plan.badge}
                      </div>
                    )}
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: active ? G : "#fff" }}>{plan.name}</div>
                    <div style={{ marginBottom: 20 }}>
                      <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Space Mono'", color: "#fff" }}>{plan.price}</span>
                      <span style={{ fontSize: 13, color: "rgba(245,240,235,0.4)" }}>{plan.period}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <span style={{ color: G, fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                          <span style={{ fontSize: 13, color: "rgba(245,240,235,0.65)", lineHeight: 1.5 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleStartForm(plan.id); }} style={{ width: "100%", padding: "12px", background: active ? `linear-gradient(135deg, ${G}, ${GD})` : "rgba(255,255,255,0.08)", color: active ? "#132440" : "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      {plan.cta} →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How it works */}
          <div style={{ background: "#0F1D32", padding: "60px 20px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>How Ad Placement Works</h2>
              <p style={{ fontSize: 14, color: "rgba(245,240,235,0.45)", textAlign: "center", marginBottom: 40 }}>Simple setup. Fast results.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
                {[
                  { n: "01", t: "Pick a plan", d: "Choose the placement level that fits your budget and goals." },
                  { n: "02", t: "We go live in 24hrs", d: "Our team sets up your placement on the homeowner page for your trade and zip." },
                  { n: "03", t: "Homeowners find you", d: "When someone in your area submits a project, they see your business first." },
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

          {/* Bottom CTA */}
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Ready to get in front of homeowners?</h2>
            <p style={{ fontSize: 14, color: "rgba(245,240,235,0.5)", marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>No charge today — we confirm your placement before billing.</p>
            <button onClick={() => handleStartForm(selectedPlan)} style={{ background: `linear-gradient(135deg, ${G}, ${GD})`, color: "#132440", border: "none", borderRadius: 10, padding: "14px 36px", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Get Started →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
