import { NextResponse } from "next/server";
import { stripeClient } from "../../lib/stripe-client";
import { founderSpotsLeft, founderCopy } from "../../lib/founder";
import { FOUNDER_LIMIT } from "../../lib/offer";

// Public, read-only: is the founder offer open, and how many spots are left (live from Stripe, cached 60 s).
// Off (active:false) when STRIPE_FOUNDER_COUPON_ID isn't set or Stripe can't be reached: the site then shows
// the standard TRIAL_DAYS / $49.99 copy, never a guessed count.
export const dynamic = "force-dynamic";

export async function GET() {
  const off = NextResponse.json({ active: false, spotsLeft: null, limit: FOUNDER_LIMIT }, { headers: { "Cache-Control": "public, max-age=30" } });
  if (!process.env.STRIPE_FOUNDER_COUPON_ID || !process.env.STRIPE_SECRET_KEY) return off;
  try {
    const stripe = stripeClient(process.env.STRIPE_SECRET_KEY);
    const left = await founderSpotsLeft(stripe);
    if (left === null || left <= 0) return off;
    return NextResponse.json({ active: true, spotsLeft: left, limit: FOUNDER_LIMIT, ...founderCopy() }, { headers: { "Cache-Control": "public, max-age=30" } });
  } catch (err: any) {
    console.error("founder-spots error:", err?.message || err);
    return off;
  }
}
