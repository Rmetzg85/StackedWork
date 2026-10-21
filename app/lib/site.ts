import { TRIAL_DAYS } from "./offer";

// Canonical site URL and the public, indexable pages (sitemap, footer "Resources", llms.txt).
// Canonical host is www (the apex redirects there).
export const SITE_URL = "https://www.letstaystacked.com";
export const SITE_NAME = "StackedWork";

export type PublicPage = { path: string; title: string; blurb: string };

/** Marketing resource pages (footer "Resources" + sitemap). */
export const RESOURCE_PAGES: PublicPage[] = [
  { path: "/estimate-app-for-contractors", title: "Estimate app for contractors", blurb: "Write an estimate on the job site and send it as a link." },
  { path: "/free-contractor-invoice-app", title: `Contractor invoice app (${TRIAL_DAYS}-day free trial)`, blurb: "Turn estimates into invoices with Net 15 due dates and overdue tracking." },
  { path: "/handyman-estimate-invoice-app", title: "Estimate and invoice app for handymen", blurb: "Log small jobs by voice and bill them the same day." },
  { path: "/faq", title: "StackedWork FAQ", blurb: "Price, free trial, cancellation, phone use, voice entry, invoices, privacy." },
];

/** Everything that belongs in the sitemap. */
export const SITEMAP_PATHS: string[] = ["/", ...RESOURCE_PAGES.map((p) => p.path), "/login", "/privacy", "/terms"];

/** Paths search engines should not crawl: the signed-in app's API, customer-facing private links, auth flow pages, internal pages. */
export const DISALLOWED_PATHS: string[] = ["/api/", "/invoice/", "/estimate/", "/l/", "/welcome", "/reset-password", "/marketing-plan", "/advertise", "/find-contractor"];

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;
