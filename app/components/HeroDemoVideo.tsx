"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TRIAL_DAYS } from "../lib/offer";

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
  const fullRef = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false); // autoplay with sound was blocked: show a big play button

  // ?play=1 (founder outreach email link): open the "Watch with sound" modal straight away, then drop `play`
  // from the URL (other params such as utm_* and trade stay) so a refresh or a shared link doesn't reopen it.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("play") !== "1") return;
      url.searchParams.delete("play");
      window.history.replaceState(window.history.state, "", url.pathname + (url.search || "") + url.hash);
      setModal(true);
    } catch { /* ignore */ }
  }, []);

  // When the modal opens, try to play with sound. Browsers (most phones) may block unmuted autoplay without a tap;
  // then the modal stays open with a large play button ready, and one tap starts it with sound.
  useEffect(() => {
    if (!modal) { setNeedsTap(false); return; }
    const v = fullRef.current;
    if (!v) return;
    v.muted = false;
    const p = v.play();
    if (p && typeof p.catch === "function") p.then(() => setNeedsTap(false)).catch(() => setNeedsTap(true));
  }, [modal]);
  const tapToPlay = () => { const v = fullRef.current; if (!v) return; v.muted = false; v.play().then(() => setNeedsTap(false)).catch(() => {}); };

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
      // preventScroll: closing the modal (incl. the ?play=1 auto-open) must not jump the page down to this button
      // and push the hero's "Start Free Trial" off-screen.
      loopRef.current?.play().catch(() => {}); openerRef.current?.focus({ preventScroll: true });
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
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative", width: "min(92vw, calc(min(80vh, 840px) * 720 / 1448))", aspectRatio: "720 / 1448" }}>
            <video ref={fullRef} src="/demo/demo-full.mp4" controls playsInline preload="auto" poster="/demo/hero-poster.webp" onPlay={() => setNeedsTap(false)}
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 16, background: "#000" }} />
            {/* Captions are burned into demo-full.mp4, so there's no <track> (a CC track would show the words twice). */}
            {needsTap && (
              <button type="button" onClick={tapToPlay} aria-label="Play the demo with sound"
                style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 88, height: 88, borderRadius: "50%", border: "none", background: "#C8E64A", color: "#132440", fontSize: 34, cursor: "pointer", boxShadow: "0 10px 30px rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: 6 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="#132440" /></svg>
              </button>
            )}
            <button ref={closeRef} type="button" onClick={() => setModal(false)} aria-label="Close video"
              style={{ position: "absolute", top: 10, right: 10, width: 40, height: 40, borderRadius: "50%", border: "none", background: "#C8E64A", color: "#132440", fontSize: 22, fontWeight: 800, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
          {/* Founder emails land here (?play=1): the next step right under the video. No overlay on the video itself:
              demo-full.mp4 ends on its own end card. */}
          <a href="/login?mode=signup" data-testid="demo-modal-cta"
            style={{ display: "inline-block", background: "#C8E64A", color: "#132440", textDecoration: "none", padding: "12px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans'", textAlign: "center" }}>
            Try it free: {TRIAL_DAYS} days, no card →
          </a>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
