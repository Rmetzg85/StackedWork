// SERVER ONLY. Founder offer: first 20 contractors get a 60-day no-card trial and a Stripe coupon
// ($20 off $49.99 = $29.99/mo, duration forever, max_redemptions 20). Staged: OFF unless
// STRIPE_FOUNDER_COUPON_ID is set, so merging this changes nothing until the env is configured.
import type Stripe from "stripe";
import { FOUNDER_LIMIT, LIST_PRICE } from "./offer";

// Founder copy: server-only (sent to the browser by /api/founder-spots only while the offer is active).
// Copy follows ACQUISITION-7DAY-2026-10-04.md §A. Dormant since Charlie dropped the coupon on 2026-10-03.
export const FOUNDER_TRIAL_DAYS = 60;
export const FOUNDER_PRICE = "$29.99";
export const FOUNDER_HEADLINE = `Founding contractors: ${FOUNDER_TRIAL_DAYS} days free, then ${FOUNDER_PRICE}/mo locked in.`;
export const FOUNDER_SUB = `No credit card. If you don't add one, it just ends. Regular price ${LIST_PRICE}/mo.`;
export const founderCopy = () => ({ trialDays: FOUNDER_TRIAL_DAYS, headline: FOUNDER_HEADLINE, sub: FOUNDER_SUB });

export const FOUNDER_META = "founder"; // subscription_data.metadata.offer

export function founderCouponId(): string | null {
  const id = (process.env.STRIPE_FOUNDER_COUPON_ID || "").trim();
  return id ? id : null;
}

/** Customer emails/ids that never count as founders (smoke + owner test signups). Comma-separated. */
function excluded(): Set<string> {
  return new Set((process.env.FOUNDER_EXCLUDE || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
}

/**
 * How many founder spots are taken. Counts EVERY subscription ever created on the founder path
 * (metadata.offer = "founder"), in any status, including trials that ended without a card. That matches
 * the coupon's max_redemptions (Stripe counts redemptions, not active subscriptions), so the site never
 * shows more spots than the coupon can still give out.
 */
export async function countFounderSubscriptions(stripe: Stripe): Promise<number> {
  const ex = excluded();
  let taken = 0;
  let page: string | undefined;
  for (let i = 0; i < 10; i++) {
    const res: any = await stripe.subscriptions.search({ query: `metadata['offer']:'${FOUNDER_META}'`, limit: 100, expand: ["data.customer"], ...(page ? { page } : {}) });
    for (const s of res.data) {
      const c: any = s.customer;
      const email = typeof c === "object" && c ? String(c.email || "").toLowerCase() : "";
      const cid = typeof c === "string" ? c.toLowerCase() : String(c?.id || "").toLowerCase();
      if ((email && ex.has(email)) || ex.has(cid)) continue;
      taken++;
    }
    if (!res.has_more || !res.next_page) break;
    page = res.next_page;
  }
  return taken;
}

/** Also ask the coupon itself (hard cap). Returns redemptions left on the coupon, or null if unknown. */
async function couponRemaining(stripe: Stripe, id: string): Promise<number | null> {
  const c: any = await stripe.coupons.retrieve(id);
  if (!c || c.valid === false) return 0;
  if (typeof c.max_redemptions === "number") return Math.max(0, c.max_redemptions - (c.times_redeemed || 0));
  return null;
}

let cache: { at: number; left: number } | null = null;

/** Spots left (0..20), cached 60 s. null = offer not configured. Throws on Stripe errors (callers fall back to standard). */
export async function founderSpotsLeft(stripe: Stripe, { fresh = false } = {}): Promise<number | null> {
  const id = founderCouponId();
  if (!id) return null;
  if (!fresh && cache && Date.now() - cache.at < 60_000) return cache.left;
  const [taken, couponLeft] = await Promise.all([countFounderSubscriptions(stripe), couponRemaining(stripe, id)]);
  let left = Math.max(0, FOUNDER_LIMIT - taken);
  if (couponLeft !== null) left = Math.min(left, couponLeft);
  cache = { at: Date.now(), left };
  return left;
}
