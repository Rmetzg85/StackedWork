// Pricing/trial constants and the founder-offer copy (client + server safe; no secrets).
// The founder offer is OFF unless the server has STRIPE_FOUNDER_COUPON_ID set (see app/lib/founder.ts).
// Copy follows /workspace/stackedwork/ACQUISITION-7DAY-2026-10-04.md §A.

export const LIST_PRICE = "$49.99";
export const STANDARD_TRIAL_DAYS = 14;
export const FOUNDER_TRIAL_DAYS = 60;
export const FOUNDER_PRICE = "$29.99";
export const FOUNDER_LIMIT = 20;

export type FounderStatus = { active: boolean; spotsLeft: number | null; limit: number };
export const FOUNDER_OFF: FounderStatus = { active: false, spotsLeft: null, limit: FOUNDER_LIMIT };

/** Trial length a new signup will get right now. */
export const trialDays = (f: FounderStatus | null | undefined) => (f?.active ? FOUNDER_TRIAL_DAYS : STANDARD_TRIAL_DAYS);

export const FOUNDER_HEADLINE = `Founding contractors: ${FOUNDER_TRIAL_DAYS} days free, then ${FOUNDER_PRICE}/mo locked in.`;
export const FOUNDER_SUB = `No credit card. If you don't add one, it just ends. Regular price ${LIST_PRICE}/mo.`;

/** Badge: the live count only when the server returned one; never a made-up number. */
export function founderBadge(f: FounderStatus): string | null {
  if (!f.active) return null;
  if (typeof f.spotsLeft === "number" && f.spotsLeft > 0) return `Founder pricing · ${f.spotsLeft} of ${f.limit} spots left`;
  return `Founder pricing · first ${f.limit} contractors`;
}

/** Normalize an /api/founder-spots response. Anything unexpected = offer off. */
export function parseFounderStatus(raw: any): FounderStatus {
  if (!raw || raw.active !== true) return FOUNDER_OFF;
  const left = Number.isInteger(raw.spotsLeft) && raw.spotsLeft >= 0 && raw.spotsLeft <= FOUNDER_LIMIT ? raw.spotsLeft : null;
  if (left === 0) return FOUNDER_OFF;
  return { active: true, spotsLeft: left, limit: FOUNDER_LIMIT };
}
