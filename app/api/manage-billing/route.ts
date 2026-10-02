import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { requireUser } from "../../lib/require-user";

// Opens the Stripe billing portal for the signed-in user's own Stripe customer.
// Nothing from the request body is used: the customer is resolved server-side from the verified user.
//  1. subscriptions row with user_id = caller
//  2. subscriptions row with email = caller's verified email (case-insensitive), not linked to another user
//  3. Stripe customers.list by the verified email, StackedWork subscriptions only (same as /api/subscription-status)
const ACTIVE = new Set(["active", "trialing", "past_due"]);
type Row = { stripe_customer_id: string | null; status: string | null; updated_at: string | null; user_id?: string | null };

// Most relevant row first: active-ish status, then most recently updated.
const pickCustomer = (rows: Row[]): string | null => {
  const withId = rows.filter((r) => typeof r.stripe_customer_id === "string" && r.stripe_customer_id.startsWith("cus_"));
  withId.sort((a, b) => (ACTIVE.has(b.status || "") ? 1 : 0) - (ACTIVE.has(a.status || "") ? 1 : 0) || String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  return withId[0]?.stripe_customer_id ?? null;
};

// Escape LIKE wildcards so ilike is an exact, case-insensitive match.
const likeExact = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function stripeClient(secret: string) {
  // STRIPE_API_BASE exists only for local tests against a mock (e.g. http://127.0.0.1:54403). Unset in prod.
  const base = process.env.STRIPE_API_BASE;
  if (base) {
    const u = new URL(base);
    return new Stripe(secret, { apiVersion: "2025-02-24.acacia", host: u.hostname, port: Number(u.port) || undefined, protocol: u.protocol.replace(":", "") as "http" | "https" });
  }
  return new Stripe(secret, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: Request) {
  const auth = await requireUser(request, { missing: "Please sign in to manage billing." });
  if (auth.response) return auth.response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!url || !serviceKey || !stripeKey) {
    console.error("manage-billing: missing env", { url: !!url, serviceKey: !!serviceKey, stripeKey: !!stripeKey });
    return NextResponse.json({ error: "Billing isn't available right now. Please try again later." }, { status: 500 });
  }

  try {
    const userId = auth.user.id;
    const email = (auth.user.email || "").trim();
    // Service role only after auth, and every query is scoped to the verified caller.
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    let customerId: string | null = null;

    const byUser = await admin.from("subscriptions").select("stripe_customer_id, status, updated_at").eq("user_id", userId).limit(20);
    if (byUser.error && byUser.error.code !== "42703") console.error("manage-billing: subscriptions by user_id", byUser.error.message);
    customerId = pickCustomer((byUser.data as Row[]) || []);

    if (!customerId && email) {
      const byEmail = await admin.from("subscriptions").select("stripe_customer_id, status, updated_at, user_id").ilike("email", likeExact(email)).limit(20);
      if (byEmail.error) console.error("manage-billing: subscriptions by email", byEmail.error.message);
      // Never use a row that is linked to a different user.
      customerId = pickCustomer(((byEmail.data as Row[]) || []).filter((r) => !r.user_id || r.user_id === userId));
    }

    const stripe = stripeClient(stripeKey);
    if (!customerId && email) {
      const priceId = process.env.STRIPE_PRICE_ID;
      const subs: Stripe.Subscription[] = [];
      // Stripe's email filter is case-sensitive; try as stored and lower-cased.
      for (const e of Array.from(new Set([email, email.toLowerCase()]))) {
        const customers = await stripe.customers.list({ email: e, limit: 10 });
        for (const c of customers.data) {
          const list = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 20 });
          subs.push(...list.data);
        }
      }
      const ours = subs.filter((s) => s.metadata?.product === "stackedwork" || (priceId && s.items.data.some((i) => i.price?.id === priceId)));
      ours.sort((a, b) => (ACTIVE.has(b.status) ? 1 : 0) - (ACTIVE.has(a.status) ? 1 : 0) || b.created - a.created);
      const s = ours[0];
      if (s) customerId = typeof s.customer === "string" ? s.customer : s.customer.id;
    }

    if (!customerId) return NextResponse.json({ error: "No billing account found" }, { status: 404 });

    // The old return_url (/dashboard) doesn't exist in this app; return to the app root.
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.letstaystacked.com").replace(/\/+$/, "");
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${site}/` });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("manage-billing error:", err?.message || err);
    return NextResponse.json({ error: "Couldn't open the billing portal. Please try again." }, { status: 500 });
  }
}
