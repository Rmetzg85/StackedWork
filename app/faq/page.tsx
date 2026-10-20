import type { Metadata } from "next";
import MarketingShell, { TrialCta } from "../components/MarketingShell";
import JsonLd from "../components/JsonLd";
import { FAQS } from "../lib/faq";
import { faqPageLd } from "../lib/seo";
import { absoluteUrl } from "../lib/site";
import { TRIAL_DAYS, LIST_PRICE } from "../lib/offer";

const title = "StackedWork FAQ: Price, Free Trial, Invoices, and More";
const description = `Straight answers about StackedWork: ${LIST_PRICE}/mo after a ${TRIAL_DAYS}-day free trial with no credit card, cancel anytime, works on your phone, voice job entry, estimates to invoices.`;

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: absoluteUrl("/faq") },
  openGraph: { title, description, url: absoluteUrl("/faq"), type: "website", siteName: "StackedWork", images: [{ url: "/og.png", width: 1200, height: 630, alt: "StackedWork: estimates and invoices from your phone" }] },
  twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
};

// The visible Q&As and the FAQPage JSON-LD are rendered from the same FAQS array (exact same text).
export default function FaqPage() {
  return (
    <MarketingShell>
      <JsonLd data={faqPageLd(FAQS)} />
      <h1>StackedWork FAQ</h1>
      <p>Short, plain answers about what StackedWork is, what it costs, and what it does and doesn&apos;t do today.</p>
      {FAQS.map((f) => (
        <section key={f.q} className="mk-faq">
          <h2 style={{ fontSize: 19, margin: "0 0 8px" }}>{f.q}</h2>
          <p>{f.a}</p>
        </section>
      ))}
      <TrialCta />
    </MarketingShell>
  );
}
