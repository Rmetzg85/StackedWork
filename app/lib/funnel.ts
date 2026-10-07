// Signup funnel events to GA4 (gtag is loaded in app/layout.tsx). No personal data: never pass the email.
// Lets us tell "opened /login but never submitted" apart from "submitted and hit an error".
export function funnel(event: string, params: Record<string, string | number | boolean> = {}): void {
  try {
    const g = (globalThis as any).gtag;
    if (typeof g === "function") g("event", event, params);
  } catch { /* analytics must never break signup */ }
}
