"use client";

const G = "#C8E64A";
const GD = "#A8C435";

const SECTIONS = [
  {
    icon: "🎯",
    title: "Target Audience",
    color: "#3B82F6",
    items: [
      { head: "Primary", body: "Independent contractors — plumbers, electricians, roofers, painters, HVAC techs, general contractors — running 1–10 person operations." },
      { head: "Secondary", body: "Small construction companies looking to modernize operations and stop using paper, spreadsheets, or disconnected apps." },
      { head: "Geography", body: "Launch focus: Baltimore/DMV area. Expand nationally via digital channels as MRR grows." },
      { head: "Pain Points", body: "Missing follow-ups, no revenue visibility, losing leads, no professional web presence, spending $200+/mo on fragmented tools." },
    ],
  },
  {
    icon: "📣",
    title: "Marketing Channels",
    color: "#8B5CF6",
    items: [
      { head: "Facebook & Instagram", body: "Targeted ads to contractors aged 25–55 by trade/occupation. Carousel ads showing before/after portfolio feature and dashboard. Budget: $300–500/mo to start." },
      { head: "TikTok", body: "Short-form videos showing real app demos — logging a job by voice, sharing a before/after to Instagram in one tap. Organic + $100/mo paid." },
      { head: "LinkedIn", body: "Thought leadership posts about contractor business growth. Founder-led content builds trust in the trades community." },
      { head: "Google Ads", body: "Search campaigns targeting 'contractor CRM', 'job tracking app for contractors', 'contractor business software'. High intent, lower volume." },
      { head: "YouTube", body: "2–3 min walkthrough videos of core features. Ranks for 'how to track contractor jobs' and similar searches. Free organic traffic." },
      { head: "Trade Forums & Groups", body: "Facebook Groups (Plumbers, Roofers, Electricians). Engage genuinely, share value, convert warm leads." },
    ],
  },
  {
    icon: "📝",
    title: "Content Strategy",
    color: "#EC4899",
    items: [
      { head: "Contractor Success Stories", body: "Real before/after portfolio posts + revenue dashboard screenshots from users. Social proof beats any ad copy." },
      { head: "Feature Demos", body: "Screen recordings of voice-to-job entry, lead management, social sharing. Show — don't tell." },
      { head: "Educational Content", body: "'How to price a bathroom remodel', 'How to follow up with leads', 'What a profitable contracting business looks like'. Positions StackedWork as the authority." },
      { head: "Comparison Posts", body: "Visual breakdowns: '$200+/mo in separate tools vs. $49.99/mo for everything'. Direct, honest, and shareable." },
      { head: "Posting Cadence", body: "Instagram/TikTok: 3–5x/week. LinkedIn: 2–3x/week. Facebook Groups: Daily engagement. YouTube: 1–2x/month." },
    ],
  },
  {
    icon: "🤝",
    title: "Partnership & Referral Strategy",
    color: "#F59E0B",
    items: [
      { head: "Supply Houses & Lumber Yards", body: "Partner with local and regional supply stores. Offer co-branded flyers at the counter. Their customers are exactly our users." },
      { head: "Trade Schools & Apprenticeship Programs", body: "Sponsor programs, offer student discounts. Build brand loyalty early in careers." },
      { head: "Contractor Associations", body: "PHCC, NECA, NRCA, NARI local chapters. Sponsorships and speaking slots at regional events." },
      { head: "Referral Program", body: "$25/mo recurring credit for every contractor referred who stays active 90 days. Word-of-mouth is the #1 trust signal in trades." },
      { head: "Homeowner-Side Network Effect", body: "letstaystacked.com's Find a Contractor page creates a two-sided marketplace — more contractors = more homeowner traffic = more contractor sign-ups." },
    ],
  },
  {
    icon: "💰",
    title: "Pricing & Conversion Strategy",
    color: "#10B981",
    items: [
      { head: "Hook", body: "14-day free trial, full access. Credit card required — qualifies serious users and reduces churn from unengaged free users." },
      { head: "Core Offer", body: "$49.99/mo — all-in. Position against the $200+/mo stack they're probably already paying for piecemeal." },
      { head: "Annual Discount", body: "Offer 2 months free on annual ($499/yr). Increases LTV and reduces monthly churn exposure." },
      { head: "Ad Upsell", body: "Featured placement on Find a Contractor page at $49.99–$199.99/mo. Contractors who want leads, not just management tools." },
      { head: "AI Website Add-On", body: "Priced separately on inquiry. High-margin, low-volume. Positions brand as full-service." },
    ],
  },
  {
    icon: "📊",
    title: "Growth Metrics & Goals",
    color: "#6366F1",
    items: [
      { head: "Month 1–3", body: "Goal: 25 paying subscribers. Focus: local Baltimore/DMV outreach, Facebook Groups, founder-led social content." },
      { head: "Month 4–6", body: "Goal: 75 paying subscribers. Launch paid Facebook/Instagram ads. Activate referral program. First trade partnership." },
      { head: "Month 7–12", body: "Goal: 200+ paying subscribers (~$10K MRR). Scale paid ads. YouTube SEO taking hold. Regional trade event presence." },
      { head: "Key Metrics", body: "MRR, Trial-to-Paid conversion rate (target: 40%+), Monthly churn (target: <5%), CAC vs. LTV ratio (target: 3:1+)." },
      { head: "North Star", body: "Revenue per contractor. The more jobs they log, leads they close, and photos they share — the stickier the product." },
    ],
  },
  {
    icon: "🚀",
    title: "Launch Playbook",
    color: "#EF4444",
    items: [
      { head: "Week 1", body: "Post founder story on LinkedIn and Instagram. Share in 5 local Facebook contractor groups. DM 20 contractors personally." },
      { head: "Week 2", body: "Record and post first TikTok/Reel demo. Ask first 10 users for a screenshot testimonial. Run first $100 Facebook ad test." },
      { head: "Week 3–4", body: "Reach out to 2 local supply houses about flyer partnership. Post comparison graphic ($200 vs $49.99). Launch Google Ads keyword test." },
      { head: "Month 2+", body: "Double down on what's converting. Kill what isn't. Add referral program. Focus on activation — make sure free trial users actually USE the product." },
    ],
  },
];

export default function MarketingPlanPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#132440", minHeight: "100vh", color: "#F5F0EB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade { animation: fadeUp .6s ease forwards; }
        .fade1 { animation: fadeUp .6s ease .1s forwards; opacity:0; }
        .mp-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px 24px; }
        .mp-item { padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .mp-item:last-child { border-bottom: none; padding-bottom: 0; }
        @media print {
          body { background: #fff; color: #000; }
          .no-print { display: none; }
        }
      `}</style>

      {/* Nav */}
      <div className="no-print" style={{ background: "#0F1D32", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ width: 32, height: 32, background: "#4A82C4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>SW</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>StackedWork</span>
        </a>
        <button onClick={() => window.print()} style={{ background: "rgba(200,230,74,0.12)", border: `1px solid ${G}33`, color: G, padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans'" }}>
          Print / Save PDF
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 20px 100px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }} className="fade">
          <div style={{ display: "inline-block", background: "rgba(200,230,74,0.12)", border: `1px solid ${G}33`, borderRadius: 100, padding: "6px 18px", fontSize: 11, fontWeight: 700, color: G, letterSpacing: "0.1em", marginBottom: 20, fontFamily: "'Space Mono'" }}>
            LETSTAYSTACKED.COM — MARKETING PLAN
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            StackedWork<br />
            <span style={{ color: G }}>Go-To-Market Strategy</span>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(245,240,235,0.55)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
            A full marketing plan for growing StackedWork from launch to 200+ paying contractors — covering audience, channels, content, partnerships, pricing, and milestones.
          </p>
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            {[["$49.99/mo", "Core product"], ["14-day trial", "Free to try"], ["$10K MRR", "12-mo target"]].map(([val, label], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Mono'", fontSize: 18, fontWeight: 700, color: G }}>{val}</div>
                <div style={{ fontSize: 11, color: "rgba(245,240,235,0.4)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 36 }} className="fade1">
          {SECTIONS.map((section, si) => (
            <div key={si} className="mp-card">
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${section.color}20`, border: `1px solid ${section.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {section.icon}
                </div>
                <div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 10, color: section.color, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 2 }}>
                    {String(si + 1).padStart(2, "0")}
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{section.title}</h2>
                </div>
              </div>

              {/* Items */}
              <div>
                {section.items.map((item, ii) => (
                  <div key={ii} className="mp-item">
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ color: G, fontSize: 14, marginTop: 1, flexShrink: 0 }}>→</span>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{item.head}: </span>
                        <span style={{ fontSize: 14, color: "rgba(245,240,235,0.6)", lineHeight: 1.6 }}>{item.body}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom summary */}
        <div style={{ marginTop: 60, background: `linear-gradient(135deg, rgba(200,230,74,0.08), rgba(200,230,74,0.03))`, border: `1px solid ${G}33`, borderRadius: 20, padding: "36px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Space Mono'", fontSize: 11, color: G, letterSpacing: "0.1em", marginBottom: 12, fontWeight: 700 }}>THE CORE MESSAGE</div>
          <p style={{ fontSize: "clamp(16px, 3vw, 22px)", fontWeight: 700, lineHeight: 1.5, maxWidth: 640, margin: "0 auto 20px", color: "#fff" }}>
            "Stop running your business out of your head.<br />
            One app. Everything you need. $49.99/mo."
          </p>
          <p style={{ fontSize: 13, color: "rgba(245,240,235,0.4)", maxWidth: 500, margin: "0 auto" }}>
            Every piece of marketing should ladder up to this. Simple, direct, and speaks directly to the contractor who's one missed lead away from leaving money on the table.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/" style={{ display: "inline-block", background: `linear-gradient(135deg, ${G}, ${GD})`, color: "#132440", textDecoration: "none", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 800 }}>
              View StackedWork →
            </a>
            <a href="/advertise" style={{ display: "inline-block", background: "rgba(255,255,255,0.08)", color: "#fff", textDecoration: "none", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "1px solid rgba(255,255,255,0.12)" }}>
              Advertise on Platform →
            </a>
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <span style={{ fontSize: 11, color: "rgba(245,240,235,0.2)", fontFamily: "'Space Mono'" }}>
            StackedWork · letstaystacked.com · A REM Ventures Product · {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </div>
  );
}
