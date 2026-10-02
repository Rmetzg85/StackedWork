import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Optional: if the caller sends a Supabase access token, link the Stripe subscription to that
// user id (metadata.user_id). Never trusts a user id from the request body.
async function verifiedUserId(request: Request): Promise<string | null> {
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return null;
  try {
    const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    return error ? null : data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
    });
    const body = await request.json();
    const { email, name, utm } = body;
    const userId = await verifiedUserId(request);

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
        metadata: { product: "stackedwork", tier: "base", ...utmMeta, ...(userId ? { user_id: userId } : {}) },
      },
      payment_method_collection: "if_required",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?cancelled=true`,
      allow_promotion_codes: true,
      ...(userId ? { client_reference_id: userId } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
