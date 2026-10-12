// Spanish welcome for the yard-sign QR (?utm_campaign=es) and Spanish-language browsers.
// The choice lives in a session cookie (sw_lang=es|en) so it survives the click to /login,
// where the server reads it and renders the form in Spanish on first paint.
// The app itself is English-only: only the homepage welcome and the /login form are translated.

export const LANG_COOKIE = "sw_lang";
export type LangChoice = "es" | "en";
export type EsReason = "stored" | "utm" | "browser";

/** Pure: value of sw_lang in a Cookie header / document.cookie string ("es" | "en" | null). */
export function parseLangCookie(cookie: string | null | undefined): LangChoice | null {
  const m = /(?:^|;\s*)sw_lang=(es|en)(?:;|$)/.exec(cookie || "");
  return m ? (m[1] as LangChoice) : null;
}

/** Pure: should the Spanish welcome show? null = no (English, unchanged).
 *  An explicit "View in English" (stored "en") wins for the rest of the visit. */
export function detectEs(search: string, navLanguage: string | null | undefined, stored: LangChoice | null): EsReason | null {
  if (stored === "en") return null;
  if (stored === "es") return "stored";
  const q = new URLSearchParams(search);
  if ((q.get("utm_campaign") || "").trim().toLowerCase() === "es" || (q.get("lang") || "").trim().toLowerCase() === "es") return "utm";
  if (typeof navLanguage === "string" && /^es(-|_|$)/i.test(navLanguage.trim())) return "browser";
  return null;
}

/** Session cookie string (no Max-Age/Expires = this visit only). */
export function langCookieString(v: LangChoice, secure: boolean): string {
  return `${LANG_COOKIE}=${v}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function readLangChoice(): LangChoice | null {
  if (typeof document === "undefined") return null;
  try { return parseLangCookie(document.cookie); } catch { return null; }
}

export function saveLangChoice(v: LangChoice): void {
  if (typeof document === "undefined") return;
  try { document.cookie = langCookieString(v, window.location.protocol === "https:"); } catch { /* cookies blocked: ignore */ }
}
