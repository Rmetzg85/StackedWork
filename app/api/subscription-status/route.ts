import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Read-only fallback for the access gate: asks Stripe (source of truth) for the signed-in user's
// StackedWork subscription when the subscriptions table has no row or a non-active one (e.g. the
// webhook upsert hasn't landed yet, or failed before schema_align was applied).
// Requires a verified Supabase JWT; only ever looks up the caller's own email.
const ACTIVE = new Set(["active", "trialing"]);

export async function POST(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!url || !anon || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  const email = userData?.user?.email;
  if (userErr || !email) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
    const priceId = process.env.STRIPE_PRICE_ID;
    // Stripe's email filter is case-sensitive; try as stored and lower-cased.
    const emails = Array.from(new Set([email, email.toLowerCase()]));
    const subs: Stripe.Subscription[] = [];
    for (const e of emails) {
      const customers = await stripe.customers.list({ email: e, limit: 10 });
      for (const c of customers.data) {
        const list = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 20 });
        subs.push(...list.data);
      }
    }
    // Only StackedWork subscriptions (the Stripe account may carry other REM Ventures products).
    const ours = subs.filter(s =>
      s.metadata?.product === "stackedwork" || (priceId && s.items.data.some(i => i.price?.id === priceId))
    );
    if (ours.length === 0) return NextResponse.json({ status: "none" });
    ours.sort((a, b) => (ACTIVE.has(b.status) ? 1 : 0) - (ACTIVE.has(a.status) ? 1 : 0) || b.created - a.created);
    const s = ours[0];
    const iso = (t?: number | null) => (t ? new Date(t * 1000).toISOString() : null);
    return NextResponse.json({
      status: s.status,
      stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer.id,
      plan: "base",
      trial_end: iso(s.trial_end),
      current_period_end: iso((s as any).current_period_end),
      cancel_at: iso(s.cancel_at),
      cancelled_at: iso(s.canceled_at),
    });
  } catch (err: any) {
    console.error("subscription-status error:", err?.message || err);
    return NextResponse.json({ error: "Couldn't reach billing" }, { status: 502 });
  }
}
