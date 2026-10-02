// Sender for all transactional email (Resend). The domain must be verified in Resend.
// Override per environment with EMAIL_FROM, e.g. "StackedWork <notifications@letstaystacked.com>".
export const EMAIL_FROM = process.env.EMAIL_FROM || "StackedWork <notifications@letstaystacked.com>";
