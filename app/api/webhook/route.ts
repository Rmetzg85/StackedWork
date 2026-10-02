// Legacy webhook path. Kept so an existing Stripe endpoint pointing at /api/webhook keeps working;
// it was a byte-for-byte copy of /api/webhooks/stripe, now it re-uses that handler so they can't drift.
export { POST } from "../webhooks/stripe/route";
