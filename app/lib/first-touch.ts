// First-touch UTM capture (no DB migration).
// Stored once in localStorage on the first visit that carries UTM params;
// later visits never overwrite it. Read at signup and saved to
// auth user_metadata + Stripe subscription metadata.

const KEY = "sw_first_touch";
const FIELDS = ["utm_source", "utm_medium", "utm_campaign"] as const;

export type FirstTouch = {
  first_touch_utm_source?: string;
  first_touch_utm_medium?: string;
  first_touch_utm_campaign?: string;
};

export function captureFirstTouch(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const ft: FirstTouch = {};
    for (const f of FIELDS) {
      const v = params.get(f);
      if (v) (ft as Record<string, string>)[`first_touch_${f}`] = v.trim().slice(0, 100);
    }
    if (Object.keys(ft).length > 0) window.localStorage.setItem(KEY, JSON.stringify(ft));
  } catch { /* storage blocked — ignore */ }
}

export function getFirstTouch(): FirstTouch {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const out: FirstTouch = {};
    for (const f of FIELDS) {
      const k = `first_touch_${f}` as keyof FirstTouch;
      if (typeof parsed?.[k] === "string" && parsed[k]) out[k] = String(parsed[k]).slice(0, 100);
    }
    return out;
  } catch { return {}; }
}
