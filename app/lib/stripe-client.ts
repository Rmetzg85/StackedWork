import Stripe from "stripe";

// STRIPE_API_BASE exists only for local tests against a mock (e.g. http://127.0.0.1:54404). Unset in prod.
export function stripeClient(secret: string): Stripe {
  const base = process.env.STRIPE_API_BASE;
  if (base) {
    const u = new URL(base);
    return new Stripe(secret, { apiVersion: "2025-02-24.acacia", host: u.hostname, port: Number(u.port) || undefined, protocol: u.protocol.replace(":", "") as "http" | "https" });
  }
  return new Stripe(secret, { apiVersion: "2025-02-24.acacia" });
}
