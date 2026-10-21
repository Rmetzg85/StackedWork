// /llms.txt: a plain-text summary of StackedWork for AI assistants, built from the same constants as the site.
import { TRIAL_DAYS, LIST_PRICE } from "./offer";
import { FAQS } from "./faq";
import { RESOURCE_PAGES, SITE_URL } from "./site";

export function llmsTxt(): string {
  return [
    "# StackedWork",
    "",
    `> StackedWork is a web app for contractors to log jobs, write estimates, and turn them into invoices from a phone. ${TRIAL_DAYS}-day free trial with no credit card, then ${LIST_PRICE} per month if you add a card; if you don't, the trial just ends.`,
    "",
    "Facts:",
    "- Who it's for: small contracting businesses and solo tradespeople (handymen, plumbers, electricians, HVAC, roofers, painters, general contractors).",
    `- Price: ${LIST_PRICE}/month, one plan, no setup fee. Free trial: ${TRIAL_DAYS} days, no credit card required. Cancel anytime in Settings → Manage Billing.`,
    "- Runs in the web browser on iPhone, Android, tablets, and computers. No app-store download.",
    "- Job entry by voice or by typing one sentence; details are filled in for review before saving.",
    "- Estimates: line items with quantity, unit, and price; tax; notes; shared as a link the customer can print or save as PDF; marked accepted or declined.",
    "- Invoices: created from an estimate in one tap or from scratch; automatic numbering; Net 15 default due date (editable); customer link page; overdue tracking; mark paid.",
    "- Does NOT collect payments yet: customers pay the contractor directly.",
    "- The app is in English (the sign-up page can be shown in Spanish).",
    "- Does not sell user or customer data. Data stored with Supabase; billing by Stripe (card numbers never stored by StackedWork).",
    "",
    "## Pages",
    `- [Home](${SITE_URL}/): overview and demo video`,
    ...RESOURCE_PAGES.map((p) => `- [${p.title}](${SITE_URL}${p.path}): ${p.blurb}`),
    `- [Start free trial / sign in](${SITE_URL}/login)`,
    `- [Privacy Policy](${SITE_URL}/privacy)`,
    `- [Terms of Service](${SITE_URL}/terms)`,
    "",
    "## FAQ",
    ...FAQS.flatMap((f) => [`### ${f.q}`, f.a, ""]),
  ].join("\n");
}
