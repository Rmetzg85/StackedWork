import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripeClient } from "../../lib/stripe-client";
import { founderCouponId, founderSpotsLeft, FOUNDER_META } from "../../lib/founder";
import { FOUNDER_TRIAL_DAYS, STANDARD_TRIAL_DAYS } from "../../lib/offer";
import { createClient } from "@supabase/supabase-js";

// Optional: if the caller sends a Supabase access token, link the Stripe subscription to that
// user id (metadata.user_id). Never trusts a user id from the request body, and only reuses an existing
// Stripe customer when the email is the verified one.
async function verifiedUser(request: Request): Promise<{ id: string; email: string | null } | null> {
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  try {
    const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    return error || !data?.user ? null : { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const stripe = stripeClient(process.env.STRIPE_SECRET_KEY!);
    const body = await request.json();
    const { name, utm } = body;
    const user = await verifiedUser(request);
    const userId = user?.id ?? null;
    // Signed in: use the verified email, never the body's. Not signed in (signup with email confirmation on):
    // the body email only pre-fills Checkout; we don't attach the session to an existing Stripe customer by it.
    const email: string | undefined = user?.email || (typeof body?.email === "string" ? body.email.trim().slice(0, 254) : "") || undefined;

    // First-touch UTM (optional) → subscription metadata. Whitelisted keys, short strings only.
    const utmMeta: Record<string, string> = {};
    for (const k of ["first_touch_utm_source", "first_touch_utm_medium", "first_touch_utm_campaign"]) {
      const v = utm?.[k];
      if (typeof v === "string" && v.trim()) utmMeta[k] = v.trim().slice(0, 100);
    }

    let customer;
    if (email && user?.email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        customer = existing.data[0];
      } else {
        customer = await stripe.customers.create({
          email,
          name: name || undefined,
          metadata: { source: "stackedwork" },
        });
      }
    }

    const baseMeta = { product: "stackedwork", tier: "base", ...utmMeta, ...(userId ? { user_id: userId } : {}) };
    const params = (founder: boolean): Stripe.Checkout.SessionCreateParams => ({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer?.id || undefined,
      customer_email: customer ? undefined : (email || undefined),
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: founder ? FOUNDER_TRIAL_DAYS : STANDARD_TRIAL_DAYS,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
        metadata: founder ? { ...baseMeta, offer: FOUNDER_META } : baseMeta,
      },
      payment_method_collection: "if_required",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}${founder ? "&offer=founder" : ""}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?cancelled=true`,
      // Stripe rejects `discounts` together with `allow_promotion_codes`, so the founder path omits promo codes.
      ...(founder ? { discounts: [{ coupon: founderCouponId()! }] } : { allow_promotion_codes: true }),
      ...(userId ? { client_reference_id: userId } : {}),
    });

    // Founder offer (staged): only when STRIPE_FOUNDER_COUPON_ID is set AND live spots remain. Any Stripe problem on
    // this path (count failed, coupon used up or invalid) falls back to the standard 14-day checkout.
    let session: Stripe.Checkout.Session | null = null;
    if (founderCouponId()) {
      try {
        const left = await founderSpotsLeft(stripe, { fresh: true });
        if (left && left > 0) session = await stripe.checkout.sessions.create(params(true));
      } catch (err: any) {
        console.error("Founder checkout fell back to standard:", err?.message || err);
        session = null;
      }
    }
    if (!session) session = await stripe.checkout.sessions.create(params(false));

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
