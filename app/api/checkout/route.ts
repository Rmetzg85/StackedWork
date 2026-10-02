import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
    const body = await request.json();
    const { email, name, utm } = body;

    // First-touch UTM (optional) → subscription metadata. Whitelisted keys, short strings only.
    const utmMeta: Record<string, string> = {};
    for (const k of ["first_touch_utm_source", "first_touch_utm_medium", "first_touch_utm_campaign"]) {
      const v = utm?.[k];
      if (typeof v === "string" && v.trim()) utmMeta[k] = v.trim().slice(0, 100);
    }

    let customer;
    if (email) {
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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer?.id || undefined,
      customer_email: customer ? undefined : (email || undefined),
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
        metadata: { product: "stackedwork", tier: "base", ...utmMeta },
      },
      payment_method_collection: "if_required",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?cancelled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
