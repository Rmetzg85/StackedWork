// JSON-LD builders (schema.org). Pure data, no JSX, so it can be unit-tested.
// No aggregateRating or reviews: StackedWork has none to show.
import { TRIAL_DAYS, LIST_PRICE } from "./offer";
import { SITE_URL, SITE_NAME } from "./site";
import type { Faq } from "./faq";

export const PRICE_NUMBER = LIST_PRICE.replace(/[^0-9.]/g, ""); // "49.99"

export const OFFER_SENTENCE = `${TRIAL_DAYS}-day free trial, no credit card required. Then ${LIST_PRICE} per month if you add a card; if you don't, the trial just ends.`;

export function softwareApplicationLd(pageUrl: string = `${SITE_URL}/`) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    mainEntityOfPage: pageUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web browser (iPhone, Android, desktop)",
    inLanguage: "en",
    description: "Job tracking, estimates, and invoices for contractors, from a phone. Log a job by voice or typing, send an estimate as a link, and turn it into an invoice with a Net 15 due date.",
    image: `${SITE_URL}/og.png`,
    offers: {
      "@type": "Offer",
      price: PRICE_NUMBER,
      priceCurrency: "USD",
      priceSpecification: { "@type": "UnitPriceSpecification", price: PRICE_NUMBER, priceCurrency: "USD", unitCode: "MON", billingDuration: "P1M" },
      description: OFFER_SENTENCE,
      url: `${SITE_URL}/login`,
      availability: "https://schema.org/InStock",
    },
    publisher: { "@type": "Organization", name: "REM Ventures", url: `${SITE_URL}/` },
  };
}

export function faqPageLd(faqs: Faq[], pageUrl: string = `${SITE_URL}/faq`) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: pageUrl,
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** Safe to drop inside <script type="application/ld+json">: no "</script" breakout. */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
