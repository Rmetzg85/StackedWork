// Content for the English resource/landing pages. Every claim must match what the app does today:
// voice or typed job entry, estimates (line items, units, tax, notes, share link, print/PDF, accepted/declined),
// estimate → invoice, invoice numbers, Net 15 default due date, overdue status, invoice link page, mark paid.
// NOT available (never claim): taking payments, leads, websites, marketplace, Spanish app, app-store app.
// Region-neutral, no competitor names, no testimonials, no stats.
import { TRIAL_DAYS, LIST_PRICE } from "./offer";

export type LandingImage = { src: string; alt: string; width: number; height: number };
export type LandingSection = { h2: string; body: string[]; bullets?: string[]; image?: LandingImage };
export type LandingPage = {
  slug: string;
  title: string;        // <title> (layout appends " | StackedWork")
  description: string;  // meta description
  h1: string;
  intro: string[];
  sections: LandingSection[];
  related: string[];    // other resource paths
};

const img = (name: string, alt: string, height: number): LandingImage => ({ src: `/seo/${name}.webp`, alt, width: 480, height });
const IMG = {
  voice: img("voice-job-entry", "StackedWork New Job screen listening while a contractor says the job out loud", 964),
  filled: img("job-details-filled", "Job details filled in from a spoken sentence, with a check-before-saving summary", 964),
  estimate: img("write-estimate", "Writing an estimate in StackedWork: line item, quantity, tax rate, and total", 964),
  customerEstimate: img("customer-estimate-view", "The estimate page a customer sees on their phone, with Print / Save as PDF", 964),
  toInvoice: img("estimate-to-invoice", "An accepted estimate with the Create Invoice button", 935),
  invoicePage: img("customer-invoice-page", "The invoice link page a customer opens, showing the amount due and due date", 1296),
  invoiceEditor: img("invoice-editor", "Invoice editor with issue date, due date, and line items", 1043),
  typed: img("typed-job-entry", "A job typed as one sentence and filled in for review", 1018),
};

const TRIAL = `${TRIAL_DAYS}-day free trial`;

export const LANDING_PAGES: Record<string, LandingPage> = {
  "estimate-app-for-contractors": {
    slug: "estimate-app-for-contractors",
    title: "Estimate App for Contractors: Write and Send Estimates From Your Phone",
    description: `Write a contractor estimate on the job site with line items, units, and tax, then send it as a link. ${TRIAL}, no credit card, then ${LIST_PRICE}/mo.`,
    h1: "An estimate app for contractors that works where the job is",
    intro: [
      "Most estimates get written twice: once as scribbled notes in the driveway, and again at the kitchen table that night. By then the customer has already talked to someone else. StackedWork is built so the estimate gets written once, on your phone, while you are still standing in front of the work.",
      "This page walks through how estimates work in StackedWork, what your customer sees, and what happens after they say yes.",
    ],
    sections: [
      {
        h2: "Start with the job, not a blank form",
        body: [
          "Every estimate starts from a job. Tap New Job and say it the way you would say it to your office: “Water heater replacement for Mike Davis at 42 Oak Street, Tuesday at 10, about eighteen fifty.” StackedWork fills in the customer, phone, address, job type, price, and date, and shows you a short summary to check before anything is saved.",
          "If you are somewhere loud, or your browser blocks the microphone, type the same sentence instead. Typed entry fills in the same details.",
        ],
        image: IMG.filled,
      },
      {
        h2: "Build the estimate line by line",
        body: [
          "An estimate in StackedWork is a list of line items. Each line has a description, a quantity, a unit, and a price, and the total updates as you go. Add a tax rate if you charge one, and use the notes for scope, exclusions, or payment terms.",
          "If you are not sure what to charge for a line, the optional AI price suggestion gives you a starting point. You always set the final number.",
        ],
        bullets: [
          "Units that match how trades actually price: hours, days, each, sq ft, linear ft, flat-rate job, and materials like bags or gallons.",
          "Tax rate and a running subtotal and total.",
          "Notes for scope, what is not included, and terms.",
          "Save as a draft and finish it later, or send it right away.",
        ],
        image: IMG.estimate,
      },
      {
        h2: "Send it as a link your customer can open anywhere",
        body: [
          "When the estimate is ready, share it as a link. Paste it into a text, an email, or whatever app your customer already uses. They open a clean estimate page on their phone with your line items, tax, and total, and they can print it or save it as a PDF for their records.",
          "There is no app for your customer to download and no account for them to create.",
        ],
        image: IMG.customerEstimate,
      },
      {
        h2: "Track what happened to every estimate",
        body: [
          "Estimates sit in one list with their status, so you can see what is still a draft, what has been sent, and what was accepted or declined. Mark an estimate accepted when the customer gives you the go-ahead, and it stays tied to the job.",
          "That list is also how you follow up: the sent estimates that never got an answer are the ones worth a phone call this week.",
        ],
      },
      {
        h2: "When the work is done, the invoice is one tap away",
        body: [
          "An accepted estimate has a Create Invoice button. It makes an invoice with the same customer and line items, gives it its own invoice number, and sets the due date to Net 15 by default (you can change it). You do not retype anything.",
          "StackedWork does not collect payments yet. Your customer pays you the way you already get paid, and you mark the invoice paid when the money comes in.",
        ],
        image: IMG.toInvoice,
      },
      {
        h2: "What it costs",
        body: [
          `StackedWork starts with a ${TRIAL}. You do not need a credit card to start. After the trial it is ${LIST_PRICE} per month if you add a card; if you don't, the trial just ends and there is nothing to cancel.`,
          "It runs in the browser on iPhone, Android, tablets, and computers, so there is nothing to install.",
        ],
      },
    ],
    related: ["/free-contractor-invoice-app", "/handyman-estimate-invoice-app", "/faq"],
  },

  "free-contractor-invoice-app": {
    slug: "free-contractor-invoice-app",
    title: `Contractor Invoice App: Free for ${TRIAL_DAYS} Days, Then ${LIST_PRICE}/mo`,
    description: `Contractor invoices from your phone: estimate to invoice in one tap, Net 15 due dates, overdue tracking, a customer link page. Free for ${TRIAL_DAYS} days, no card.`,
    h1: `A contractor invoice app you can try free for ${TRIAL_DAYS} days`,
    intro: [
      `First, what “free” means here, plainly: StackedWork is free for ${TRIAL_DAYS} days, with no credit card needed to start. After that it costs ${LIST_PRICE} per month. If you never add a card, the trial ends on its own and you are not charged. There is no free-forever plan.`,
      "With that out of the way, here is how invoicing works in StackedWork, and what it does not do yet.",
    ],
    sections: [
      {
        h2: "Invoices that start from the estimate",
        body: [
          "The fastest invoice is the one you do not have to type. When a job came from an estimate in StackedWork, the Create Invoice button on that estimate builds the invoice for you with the same customer and line items. Change a quantity if the job grew, add a line for the extra trip, and it is ready.",
          "You can also create an invoice on its own for work that never had an estimate.",
        ],
        image: IMG.toInvoice,
      },
      {
        h2: "Numbers, dates, and Net 15 by default",
        body: [
          "Each invoice gets its own invoice number automatically, so your records stay in order without a spreadsheet. The issue date is filled in, and the due date defaults to Net 15: fifteen days after the issue date. If you work on different terms with a customer, change the due date on that invoice.",
        ],
        bullets: [
          "Automatic invoice numbering.",
          "Issue date and a Net 15 default due date you can edit.",
          "Line items with quantity, unit, and price, plus a tax rate.",
          "Notes for anything the customer needs to know.",
        ],
        image: IMG.invoiceEditor,
      },
      {
        h2: "A link page your customer can open, print, or save",
        body: [
          "Send the invoice as a link by text, email, or any messaging app. Your customer opens a clear invoice page on their phone showing the line items, the amount due, and the due date. They can print it or save it as a PDF, and they do not need an account.",
        ],
        image: IMG.invoicePage,
      },
      {
        h2: "What it does not do yet: collect payments",
        body: [
          "StackedWork does not take card or bank payments for you today. The invoice page tells your customer to contact you about how to pay, and they pay you the way you already accept money: check, cash, a payment app, or your existing card reader.",
          "When the payment arrives, mark the invoice paid. If we add payment collection later, this page will say so.",
        ],
      },
      {
        h2: "Know who owes you, without digging",
        body: [
          "Invoices live in one list with their status. Anything unpaid past its due date is marked overdue, with how many days late it is, so the follow-up calls are obvious. The top of the list adds up what is outstanding, what is overdue, and what has been paid.",
          "Estimates and invoices are connected, too: open an estimate and you can see which invoices were made from it.",
        ],
      },
      {
        h2: "Built for a phone, not a back office",
        body: [
          "StackedWork runs in the web browser on iPhone and Android, and on a computer when you want a bigger screen. Jobs can be entered by voice or by typing one sentence, and the same account works on every device.",
          `Start the ${TRIAL} with just an email and a password. No credit card. After ${TRIAL_DAYS} days, it is ${LIST_PRICE} per month if you decide to keep it.`,
        ],
      },
    ],
    related: ["/estimate-app-for-contractors", "/handyman-estimate-invoice-app", "/faq"],
  },

  "handyman-estimate-invoice-app": {
    slug: "handyman-estimate-invoice-app",
    title: "Estimate and Invoice App for Handymen: Small Jobs, Billed the Same Day",
    description: `Handyman app: log small jobs by voice, quote hourly or flat-rate, and bill the same day with an invoice link. ${TRIAL}, no card, then ${LIST_PRICE}/mo.`,
    h1: "Estimates and invoices for handymen who do five jobs a day",
    intro: [
      "Handyman work is a lot of small jobs: a leaky faucet at nine, a door that sticks at eleven, gutters in the afternoon. Each one is too small to justify an evening of paperwork and too important to forget to bill. StackedWork is set up so each job takes about a minute to log and a minute to invoice.",
    ],
    sections: [
      {
        h2: "Log the job in one sentence",
        body: [
          "Between stops, open StackedWork and say what the job is: “Dana Price, 44 Elm Street, gutter cleaning, Saturday, two fifty.” The customer, address, job type, date, and price are filled in for you to check before saving. Typing the same sentence works too, which is handy in a loud basement or a browser that blocks the microphone.",
          "Your jobs list then shows the day at a glance: what is scheduled, what is done, and what still needs a price.",
        ],
        image: IMG.typed,
      },
      {
        h2: "Quote the way you actually charge",
        body: [
          "Small jobs are priced in different ways, and StackedWork's estimate line items handle the common ones. Charge by the hour, by the day, as a flat-rate job, or per item, and add materials as their own lines.",
        ],
        bullets: [
          "Hourly labor: “3 hours” at your rate.",
          "Flat-rate jobs: “1 job” for a fixed price, such as a faucet swap.",
          "Per-item work: “4 each” for outlets, blinds, or smoke detectors.",
          "Materials: bags, gallons, linear ft, or sq ft.",
        ],
        image: IMG.estimate,
      },
      {
        h2: "Send a quote before you leave the driveway",
        body: [
          "For bigger asks, like a list of repairs before a home sale, write the estimate on the spot and send it as a link. The customer gets a clean page with each line and the total, which they can print or save as a PDF. Mark it accepted when they say go.",
          "For the many jobs that are agreed on the spot, skip the estimate and go straight to the invoice when you finish.",
        ],
        image: IMG.customerEstimate,
      },
      {
        h2: "Bill the same day",
        body: [
          "The habit that keeps a handyman business healthy is invoicing before the next job, not on Sunday night. In StackedWork, an accepted estimate becomes an invoice with one tap, and a job without an estimate can get its own invoice in a minute. Invoices are numbered for you and default to a Net 15 due date.",
          "Send the invoice link by text. Your customer sees the amount due and the due date on their phone.",
        ],
        image: IMG.invoicePage,
      },
      {
        h2: "Keep track of who has paid",
        body: [
          "StackedWork does not process payments, so customers pay you however you already take payment. Mark each invoice paid when the money comes in, and anything past its due date is flagged as overdue. With many small invoices out at once, that list is what stops a $95 job from slipping through the cracks.",
        ],
      },
      {
        h2: "Try it on this week's jobs",
        body: [
          `StackedWork has a ${TRIAL} with no credit card. Log this week's jobs, send a few invoices, and see if it saves you the evening paperwork. After ${TRIAL_DAYS} days it is ${LIST_PRICE} per month if you add a card; otherwise the trial simply ends.`,
          "It works in the browser on your phone, so there is nothing to install. The app is in English.",
        ],
      },
    ],
    related: ["/estimate-app-for-contractors", "/free-contractor-invoice-app", "/faq"],
  },
};

/** Word count of a page's visible copy (h1, intro, headings, body, bullets). */
export function landingWordCount(p: LandingPage): number {
  const parts = [p.h1, ...p.intro, ...p.sections.flatMap((s) => [s.h2, ...s.body, ...(s.bullets || [])])];
  return parts.join(" ").split(/\s+/).filter(Boolean).length;
}
