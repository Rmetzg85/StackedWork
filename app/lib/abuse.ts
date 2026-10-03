import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { HONEYPOT_FIELD } from "./honeypot-field";

// Spam protection for the public (unauthenticated) form endpoints: a honeypot field plus a per-IP rate limit.
//
// Rate limit storage, in order:
//  1. Supabase table counter via public.rate_limit_hit() (migration 20261003200000_rate_limits.sql). It's shared
//     by every serverless instance, so the limit holds on Vercel.
//  2. If that function/table doesn't exist yet (migration not applied), Supabase isn't configured, or the call
//     fails or is slow, we fall back to an in-memory fixed window. That only applies per instance, so it's weaker,
//     but it's never worse than no limit. A missing function is remembered for 10 minutes to avoid a wasted round trip.
// IPs are never stored: the key is a salted SHA-256 of the IP plus the route name.

/** Hidden field the forms render off-screen (components/Honeypot). Real users and browser autofill leave it empty. */
export { HONEYPOT_FIELD };

export function isHoneypot(body: unknown): boolean {
  const v = (body as Record<string, unknown> | null)?.[HONEYPOT_FIELD];
  return v !== undefined && v !== null && v !== false && String(v).trim() !== "";
}

export function clientIp(request: Request): string {
  const h = request.headers;
  // Vercel sets x-forwarded-for (client first) and x-real-ip; x-vercel-forwarded-for can't be spoofed by the client.
  const raw = h.get("x-vercel-forwarded-for") || h.get("x-forwarded-for") || h.get("x-real-ip") || "";
  return raw.split(",")[0].trim() || "unknown";
}

type Result = { ok: boolean; count: number; limit: number; retryAfter: number; store: "table" | "memory" };

const mem = new Map<string, { count: number; reset: number }>();
let tableMissingUntil = 0;

function memoryHit(key: string, limit: number, windowSec: number): Result {
  const now = Date.now();
  if (mem.size > 5000) for (const [k, v] of mem) if (v.reset <= now) mem.delete(k);
  let e = mem.get(key);
  if (!e || e.reset <= now) { e = { count: 0, reset: now + windowSec * 1000 }; mem.set(key, e); }
  e.count += 1;
  return { ok: e.count <= limit, count: e.count, limit, retryAfter: Math.max(1, Math.ceil((e.reset - now) / 1000)), store: "memory" };
}

const MISSING = new Set(["PGRST202", "42883", "42P01"]);

export async function rateLimit(route: string, ip: string, limit: number, windowSec: number): Promise<Result> {
  const salt = process.env.RATE_LIMIT_SALT || "stackedwork-rl-v1";
  const key = `${route}:${createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 32)}`;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && service && Date.now() >= tableMissingUntil) {
    try {
      const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 1500);
      const { data, error } = await admin.rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSec }).abortSignal(ctrl.signal);
      clearTimeout(timer);
      if (!error && typeof data === "number") {
        const now = Math.floor(Date.now() / 1000);
        return { ok: data <= limit, count: data, limit, retryAfter: Math.max(1, windowSec - (now % windowSec)), store: "table" };
      }
      if (error && (MISSING.has(String(error.code)) || /could not find the function|does not exist/i.test(error.message || ""))) {
        tableMissingUntil = Date.now() + 10 * 60 * 1000;
        console.warn("rate-limit: rate_limit_hit() not found; using in-memory fallback (apply migration 20261003200000_rate_limits.sql)");
      } else if (error) {
        console.warn("rate-limit: table counter failed; using in-memory fallback:", error.code, error.message);
      }
    } catch (err: any) {
      console.warn("rate-limit: table counter unavailable; using in-memory fallback:", err?.name || err);
    }
  }
  return memoryHit(key, limit, windowSec);
}

/** Test hook (local tests only). */
export function __resetRateLimitMemory() { mem.clear(); tableMissingUntil = 0; }
