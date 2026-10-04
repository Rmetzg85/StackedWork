// Trial length + pricing constants and the founder-status shape (client + server safe; no secrets).
// TRIAL_DAYS is the single source for the trial every new account gets (Stripe trial_period_days and all copy).
// The founder offer (app/lib/founder.ts) is dormant unless the server has STRIPE_FOUNDER_COUPON_ID set. Its copy
// (price, trial length) lives server-side only and reaches the browser via /api/founder-spots when it's active,
// so none of it is in the client bundle while the offer is off.

export const LIST_PRICE = "$49.99";
/** The one trial length every new account gets. Change it here only. */
export const TRIAL_DAYS = 30;
/** Alias kept for the dormant founder code path. */
export const STANDARD_TRIAL_DAYS = TRIAL_DAYS;
export const FOUNDER_LIMIT = 20;

export type FounderStatus = {
  active: boolean;
  spotsLeft: number | null;
  limit: number;
  /** Server-supplied when active; null when off. */
  trialDays: number | null;
  headline: string | null;
  sub: string | null;
};
export const FOUNDER_OFF: FounderStatus = { active: false, spotsLeft: null, limit: FOUNDER_LIMIT, trialDays: null, headline: null, sub: null };

/** Trial length a new signup will get right now. */
export const trialDays = (f: FounderStatus | null | undefined) => (f?.active && f.trialDays ? f.trialDays : TRIAL_DAYS);

/** Badge: the live count only when the server returned one; never a made-up number. */
export function founderBadge(f: FounderStatus): string | null {
  if (!f.active) return null;
  if (typeof f.spotsLeft === "number" && f.spotsLeft > 0) return `Founder pricing · ${f.spotsLeft} of ${f.limit} spots left`;
  return `Founder pricing · first ${f.limit} contractors`;
}

const str = (v: any) => (typeof v === "string" && v.trim() && v.length <= 200 ? v.trim() : null);

/** Normalize an /api/founder-spots response. Anything unexpected (incl. missing copy) = offer off. */
export function parseFounderStatus(raw: any): FounderStatus {
  if (!raw || raw.active !== true) return FOUNDER_OFF;
  const left = Number.isInteger(raw.spotsLeft) && raw.spotsLeft >= 0 && raw.spotsLeft <= FOUNDER_LIMIT ? raw.spotsLeft : null;
  if (left === 0) return FOUNDER_OFF;
  const days = Number.isInteger(raw.trialDays) && raw.trialDays >= 1 && raw.trialDays <= 365 ? raw.trialDays : null;
  const headline = str(raw.headline), sub = str(raw.sub);
  if (!days || !headline || !sub) return FOUNDER_OFF;
  return { active: true, spotsLeft: left, limit: FOUNDER_LIMIT, trialDays: days, headline, sub };
}
