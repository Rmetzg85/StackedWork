// First-touch attribution (no DB migration).
// Stored once in localStorage on the first visit that carries UTM params or ?trade=;
// later visits never overwrite a stored value (a trade can be added to an existing
// record that has none). Read at signup and saved to auth user_metadata
// (first_touch_*) + Stripe subscription metadata.

const KEY = "sw_first_touch";
const FIELDS = ["utm_source", "utm_medium", "utm_campaign"] as const;

/** Trades used in outreach links. Any normalized slug is accepted; these are just the known ones. */
export const KNOWN_TRADES = ["plumbing", "hvac", "electrical", "roofing", "general"] as const;

export type FirstTouch = {
  first_touch_utm_source?: string;
  first_touch_utm_medium?: string;
  first_touch_utm_campaign?: string;
  first_touch_trade?: string;
};

/** ?trade= value -> lowercase, [a-z0-9-] only, max 32 chars. "" if nothing usable. */
export function normalizeTrade(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
}

/** Pure: merge the current URL's params into a stored record (null = nothing stored yet). Returns null if nothing to store. */
export function mergeFirstTouch(stored: FirstTouch | null, search: string): FirstTouch | null {
  const params = new URLSearchParams(search);
  const trade = normalizeTrade(params.get("trade"));
  if (stored) {
    if (stored.first_touch_trade || !trade) return null; // never overwrite
    return { ...stored, first_touch_trade: trade };
  }
  const ft: FirstTouch = {};
  for (const f of FIELDS) {
    const v = params.get(f);
    if (v) (ft as Record<string, string>)[`first_touch_${f}`] = v.trim().slice(0, 100);
  }
  if (trade) ft.first_touch_trade = trade;
  return Object.keys(ft).length > 0 ? ft : null;
}

export function captureFirstTouch(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    let stored: FirstTouch | null = null;
    if (raw) { try { stored = JSON.parse(raw) || {}; } catch { stored = {}; } }
    const next = mergeFirstTouch(stored, window.location.search);
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* storage blocked — ignore */ }
}

/** Pure: validate a stored record. */
export function cleanFirstTouch(parsed: any): FirstTouch {
  const out: FirstTouch = {};
  for (const f of FIELDS) {
    const k = `first_touch_${f}` as keyof FirstTouch;
    if (typeof parsed?.[k] === "string" && parsed[k]) out[k] = String(parsed[k]).slice(0, 100);
  }
  const trade = normalizeTrade(parsed?.first_touch_trade);
  if (trade) out.first_touch_trade = trade;
  return out;
}

export function getFirstTouch(): FirstTouch {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return cleanFirstTouch(JSON.parse(raw));
  } catch { return {}; }
}
