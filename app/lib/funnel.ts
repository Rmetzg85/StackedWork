// Signup funnel events to GA4 (gtag is loaded in app/layout.tsx). No personal data: never pass the email.
// Lets us tell "opened /login but never submitted" apart from "submitted and hit an error".
// gtag is defined by an afterInteractive script, i.e. after hydration, so events fired on mount (signup_view,
// es_banner_view) would be dropped. If gtag isn't there yet, retry for up to ~5s instead.
export function funnel(event: string, params: Record<string, string | number | boolean> = {}, tries = 50): void {
  try {
    const g = (globalThis as any).gtag;
    if (typeof g === "function") { g("event", event, params); return; }
    if (tries > 0 && typeof setTimeout === "function" && typeof window !== "undefined") setTimeout(() => funnel(event, params, tries - 1), 100);
  } catch { /* analytics must never break signup */ }
}
