// Public FAQ (/faq). Plain strings so the visible page and the FAQPage JSON-LD are built from the same text.
// Each answer's first sentence stands on its own. Keep every claim true to what the app does today.
import { TRIAL_DAYS, LIST_PRICE } from "./offer";

export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  { q: "What is StackedWork?",
    a: "StackedWork is a web app that lets contractors log jobs, write estimates, and turn them into invoices from a phone. It also keeps your customers, job photos, receipts, and revenue in one place, so you are not juggling notes, spreadsheets, and texts." },
  { q: "Who is StackedWork for?",
    a: "StackedWork is for small contracting businesses and solo tradespeople, such as handymen, plumbers, electricians, HVAC techs, roofers, painters, and general contractors. It is built for people who run the business from the truck rather than from an office." },
  { q: "How much does StackedWork cost?",
    a: `StackedWork costs ${LIST_PRICE} per month after a ${TRIAL_DAYS}-day free trial. There is one plan, with no setup fee. Applicable taxes may be added.` },
  { q: "Do I need a credit card to start the free trial?",
    a: `No, the ${TRIAL_DAYS}-day free trial does not require a credit card. You sign up with an email address and a password, then tap "Start trial" on a secure Stripe page without entering a card.` },
  { q: "What happens when the free trial ends?",
    a: `If you have not added a payment method by the end of the ${TRIAL_DAYS}-day trial, the trial simply ends and you are not charged. To keep using StackedWork, add a card and the subscription continues at ${LIST_PRICE} per month.` },
  { q: "Can I cancel anytime?",
    a: "Yes, you can cancel anytime in Settings → Manage Billing, or by emailing us. If you never added a card during the trial, there is nothing to cancel." },
  { q: "Does StackedWork work on my phone?",
    a: "Yes, StackedWork runs in the web browser on iPhone and Android phones, and also on tablets and computers. There is nothing to download from an app store: open letstaystacked.com and sign in." },
  { q: "Can I enter a job by voice?",
    a: "Yes, you can say a job out loud and StackedWork fills in the customer, phone, address, job type, price, and date for you to check before saving. If your browser blocks the microphone (some in-app browsers do), you can type the same sentence instead." },
  { q: "How do estimates work in StackedWork?",
    a: "In StackedWork you build an estimate from line items with a quantity, a unit (such as hours, sq ft, or a flat rate), and a price, then add tax and notes. You share it with your customer as a link they can open on any phone, print, or save as a PDF, and you mark it accepted or declined." },
  { q: "Can I turn an estimate into an invoice?",
    a: "Yes, the Create Invoice button on an estimate makes an invoice with the same customer and line items. Each invoice gets its own number and a due date that defaults to Net 15 (you can change it), plus a link page your customer can open, print, or save as a PDF." },
  { q: "Can my customers pay an invoice through StackedWork?",
    a: "Not yet: StackedWork does not collect payments, so your customer pays you the way you already accept payment. When the money arrives you mark the invoice paid, and unpaid invoices past their due date show as overdue." },
  { q: "Is my business data private?",
    a: "StackedWork does not sell your personal information or your customers' information. Your account and business data are stored with Supabase, and subscriptions are handled by Stripe, so StackedWork never sees or stores card numbers. The Privacy Policy has the details." },
  { q: "Is StackedWork available in Spanish?",
    a: "Not yet: the StackedWork app is in English for now. The sign-up page can be shown in Spanish, but the app itself, estimates, and invoices are in English." },
];
