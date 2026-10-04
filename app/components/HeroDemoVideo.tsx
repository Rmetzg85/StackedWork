"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Homepage hero demo: a real screen recording of the production app (see public/demo/CREDITS.md).
// Performance: nothing is fetched before the window `load` event (the frame is below the fold and shows a
// solid placeholder until then). After load the 35 KB poster is requested, and the <video> is mounted only
// once the frame is actually on screen, so neither competes with LCP.
// prefers-reduced-motion or Save-Data: poster only (no autoplay); the full version is still one tap away.
const W = 600, H = 1206; // intrinsic size of the poster/loop (mobile app screen, 2x)

export default function HeroDemoVideo() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [mountLoop, setMountLoop] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    if (document.readyState === "complete") { setLoaded(true); return; }
    const on = () => setLoaded(true);
    window.addEventListener("load", on, { once: true });
    return () => window.removeEventListener("load", on);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as any).connection?.saveData === true;
    if (reduce || saveData) return;
    let io: IntersectionObserver | null = null;
    const arm = () => {
      const el = wrapRef.current;
      if (!el) return;
      if (!("IntersectionObserver" in window)) { setMountLoop(true); return; }
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { setMountLoop(true); io?.disconnect(); }
      }, { threshold: 0.2 }); // only once it is actually on screen, so visitors who never scroll never download it
      io.observe(el);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    return () => { window.removeEventListener("load", arm); io?.disconnect(); };
  }, []);

  // Modal: pause the loop, focus the close button, Esc closes, focus returns to the opener.
  useEffect(() => {
    if (!modal) return;
    loopRef.current?.pause();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey); document.body.style.overflow = prev;
      loopRef.current?.play().catch(() => {}); openerRef.current?.focus();
    };
  }, [modal]);

  return (
    <div style={{ position: "relative", zIndex: 1, marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ fontFamily: "'Space Mono'", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,240,235,0.55)" }}>
        The real app, recorded at phone size
      </div>
      <div ref={wrapRef} style={{ position: "relative", width: "min(300px, 72vw)", aspectRatio: `${W} / ${H}`, borderRadius: 28, overflow: "hidden", border: "6px solid #0B1626", boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(200,230,74,0.18)", background: "#132440" }}>
        {loaded && <img src="/demo/hero-poster.webp" width={W} height={H} alt="StackedWork on a phone: a job filled in from one spoken sentence" loading="lazy" decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: playing ? 0 : 1, transition: "opacity .3s" }} />}
        {mountLoop && (
          <video ref={loopRef} muted autoPlay loop playsInline preload="none" poster="/demo/hero-poster.webp" width={W} height={H}
            aria-label="Demo: log a job by voice, save it, write an estimate, share the link" onPlaying={() => setPlaying(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}>
            {/* H.264 first: at this content it is smaller than VP9 (445 KB vs 617 KB). WebM is the fallback. */}
            <source src="/demo/hero-loop.mp4" type="video/mp4" />
            <source src="/demo/hero-loop.webm" type="video/webm" />
          </video>
        )}
      </div>
      <button ref={openerRef} type="button" onClick={() => setModal(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", color: "#F5F0EB", border: "1px solid rgba(255,255,255,0.2)", padding: "11px 20px", fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans'", borderRadius: 100, cursor: "pointer" }}>
        <span aria-hidden="true">▶</span> Watch with sound (45 s)
      </button>
      {modal && createPortal(
        // Portaled to <body> so it sits above the fixed nav and the chat bubble (the hero is its own stacking context).
        <div role="dialog" aria-modal="true" aria-label="StackedWork demo with sound" onClick={() => setModal(false)}
          style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(5,10,20,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(92vw, calc(min(88vh, 900px) * 720 / 1448))", aspectRatio: "720 / 1448" }}>
            <video src="/demo/demo-full.mp4" controls autoPlay playsInline preload="metadata" poster="/demo/hero-poster.webp"
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 16, background: "#000" }}>
              <track kind="captions" src="/demo/demo-full.en.vtt" srcLang="en" label="English" />
            </video>
            <button ref={closeRef} type="button" onClick={() => setModal(false)} aria-label="Close video"
              style={{ position: "absolute", top: 10, right: 10, width: 40, height: 40, borderRadius: "50%", border: "none", background: "#C8E64A", color: "#132440", fontSize: 22, fontWeight: 800, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
