import type { ReactNode } from "react";
import { RESOURCE_PAGES } from "../lib/site";
import { TRIAL_DAYS, LIST_PRICE } from "../lib/offer";

const G = "#C8E64A";
const GD = "#A8C435";

/** Primary CTA used on every resource page (normal signup at /login). */
export function TrialCta({ label = `Start your ${TRIAL_DAYS}-day free trial` }: { label?: string }) {
  return (
    <div className="mk-cta">
      <a href="/login" className="mk-btn">{label}</a>
      <p className="mk-fine">No credit card. Then {LIST_PRICE}/mo only if you add a card. If you don&apos;t, the trial just ends.</p>
    </div>
  );
}

/** Server-rendered shell for the public resource pages (no client JS needed). */
export default function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="mk">
      <style>{`
        .mk{font-family:'DM Sans',system-ui,-apple-system,sans-serif;background:#132440;min-height:100vh;color:#F5F0EB}
        .mk a{color:${G}}
        .mk-top{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:880px;margin:0 auto;padding:18px 20px}
        .mk-logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:#F5F0EB !important;font-weight:700;font-size:17px}
        .mk-logo span.b{width:34px;height:34px;background:#4A82C4;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff}
        .mk-top nav{display:flex;gap:14px;align-items:center;font-size:14px}
        .mk-top nav a{text-decoration:none;color:rgba(245,240,235,0.85)}
        .mk-top nav a.mk-start{background:linear-gradient(135deg,${G},${GD});color:#132440;font-weight:700;padding:9px 14px;border-radius:7px}
        .mk-main{max-width:760px;margin:0 auto;padding:12px 20px 56px}
        .mk h1{font-size:clamp(30px,6vw,44px);line-height:1.12;font-weight:800;letter-spacing:-0.02em;margin:18px 0 18px;color:#fff}
        .mk h2{font-size:23px;line-height:1.25;font-weight:700;margin:40px 0 12px;color:#fff}
        .mk h3{font-size:18px;line-height:1.35;font-weight:700;margin:0 0 6px;color:#fff}
        .mk p,.mk li{font-size:16.5px;line-height:1.7;color:rgba(245,240,235,0.86)}
        .mk p{margin:0 0 14px}
        .mk ul{padding-left:22px;margin:4px 0 16px}
        .mk li{margin-bottom:6px}
        .mk figure{margin:18px auto 8px;max-width:300px}
        .mk figure img{width:100%;height:auto;border-radius:18px;border:1px solid rgba(255,255,255,0.12);display:block}
        .mk figcaption{font-size:13px;color:rgba(245,240,235,0.6);text-align:center;margin-top:8px;line-height:1.5}
        .mk-main p a,.mk-main li a{text-decoration:underline;text-underline-offset:2px}
        .mk-cta{margin:28px 0 8px;padding:20px;border:1px solid rgba(200,230,74,0.4);background:rgba(200,230,74,0.08);border-radius:14px;text-align:center}
        .mk-btn{display:inline-block;background:linear-gradient(135deg,${G},${GD});color:#132440 !important;font-weight:800;font-size:17px;text-decoration:none;padding:15px 24px;border-radius:10px}
        .mk-fine{font-size:13.5px !important;color:rgba(245,240,235,0.75) !important;margin:12px 0 0 !important}
        .mk-faq{border-top:1px solid rgba(255,255,255,0.08);padding:20px 0}
        .mk-foot{border-top:1px solid rgba(255,255,255,0.08);max-width:880px;margin:0 auto;padding:28px 20px 44px;font-size:13.5px;color:rgba(245,240,235,0.6)}
        .mk-foot h2{font-size:14px;margin:0 0 10px;color:rgba(245,240,235,0.85);text-transform:uppercase;letter-spacing:.06em}
        .mk-foot ul{list-style:none;padding:0;margin:0 0 18px;display:flex;flex-wrap:wrap;gap:8px 20px}
        .mk-foot li{font-size:14px;margin:0}
        .mk-foot a{color:rgba(245,240,235,0.85)}
      `}</style>
      <header className="mk-top">
        <a href="/" className="mk-logo"><span className="b" aria-hidden="true">SW</span>StackedWork</a>
        <nav aria-label="Main">
          <a href="/faq">FAQ</a>
          <a href="/login?mode=signin">Sign in</a>
          <a href="/login" className="mk-start">Start free trial</a>
        </nav>
      </header>
      <main className="mk-main">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mk-foot">
      <h2>Resources</h2>
      <ul>
        {RESOURCE_PAGES.map((p) => <li key={p.path}><a href={p.path}>{p.title}</a></li>)}
      </ul>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
        <li><a href="mailto:ryan@remventures.tech">ryan@remventures.tech</a></li>
      </ul>
      <p style={{ fontSize: 12.5, color: "rgba(245,240,235,0.72)", margin: 0 }}>StackedWork is a REM Ventures product. The app is in English.</p>
    </footer>
  );
}
