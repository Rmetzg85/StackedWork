"use client";
import { useEffect, useState } from "react";
import { detectEs, readLangChoice, saveLangChoice } from "../lib/es-lang";
import { TRIAL_DAYS } from "../lib/offer";
import { funnel } from "../lib/funnel";

const G = "#C8E64A";

// Spanish welcome at the top of the homepage. Renders nothing for English visitors (no change for them).
export default function EsWelcome() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reason = detectEs(window.location.search, navigator.language, readLangChoice());
    if (!reason) return;
    saveLangChoice("es");
    setShow(true);
    funnel("es_banner_view", { reason }); // no PII: reason is "utm" | "browser" | "stored"
  }, []);

  if (!show) return null;
  return (
    <section lang="es" data-testid="es-welcome" aria-label="Bienvenida en español"
      style={{ position: "relative", zIndex: 2, background: "#132440", padding: "100px 20px 28px", borderBottom: `3px solid ${G}` }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", fontFamily: "'DM Sans', sans-serif", color: "#F5F0EB" }}>
        <h2 style={{ fontSize: "clamp(26px,7vw,40px)", fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.02em", margin: "0 0 14px" }}>
          <span style={{ color: G }}>CONTRATISTAS:</span> Cotizaciones y facturas desde su celular.
        </h2>
        <p style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.45, margin: "0 0 20px" }}>
          Pruébelo <strong style={{ color: G }}>GRATIS</strong> por {TRIAL_DAYS} días. Sin tarjeta de crédito.
        </p>
        <a href="/login" data-testid="es-cta" onClick={() => { saveLangChoice("es"); funnel("es_cta_click"); }}
          style={{ display: "block", width: "100%", maxWidth: 360, margin: "0 auto", padding: "16px 20px", borderRadius: 10, background: `linear-gradient(135deg,${G},#A8C435)`, color: "#132440", fontWeight: 800, fontSize: 18, textDecoration: "none" }}>
          Empezar gratis
        </a>
        <p style={{ fontSize: 13, color: "rgba(245,240,235,0.75)", margin: "14px 0 6px" }}>La aplicación está en inglés por ahora.</p>
        <button type="button" lang="en" data-testid="es-dismiss" onClick={() => { saveLangChoice("en"); setShow(false); funnel("es_banner_dismiss"); }}
          style={{ background: "none", border: "none", color: "rgba(245,240,235,0.85)", textDecoration: "underline", fontSize: 13, cursor: "pointer", padding: "10px 12px", fontFamily: "inherit" }}>
          View in English
        </button>
      </div>
    </section>
  );
}
