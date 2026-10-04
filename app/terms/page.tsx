import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";
import { founderCouponId, FOUNDER_PRICE, FOUNDER_TRIAL_DAYS } from "../lib/founder";
import { FOUNDER_LIMIT, TRIAL_DAYS } from "../lib/offer";

export const metadata: Metadata = {
  title: "Terms of Service | StackedWork",
  description: "The terms for using StackedWork.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 2, 2026">
      <p>
        These terms cover your use of StackedWork (letstaystacked.com), a service run by REM Ventures (&quot;we&quot;, &quot;us&quot;).
        By creating an account or using the service, you agree to them. If you don&apos;t agree, please don&apos;t use StackedWork.
        Questions: <a href="mailto:ryan@remventures.tech">ryan@remventures.tech</a>.
      </p>

      <h2>The service</h2>
      <p>
        StackedWork helps contractors track jobs, customers, estimates, leads, receipts, and before/after photos. It includes AI
        features. We may add, change, or remove features over time.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 18 and using StackedWork for your business.</li>
        <li>Keep your login secure. You are responsible for activity on your account.</li>
        <li>Give us a working email address. We use it for sign-in, billing, and account notices.</li>
      </ul>

      <h2>Free trial, billing, and cancellation</h2>
      <ul>
        <li>New accounts get a {TRIAL_DAYS}-day free trial. No credit card is required to start.</li>
        {/* Staged founder clause: only rendered when STRIPE_FOUNDER_COUPON_ID is set at build time. */}
        {founderCouponId() && <li>Founder offer: while it is available, the first {FOUNDER_LIMIT} contractors who start a subscription under it get a {FOUNDER_TRIAL_DAYS}-day free trial instead, and then pay {FOUNDER_PRICE} per month (plus any applicable taxes) for as long as that subscription stays active. If the subscription ends, the founder price ends with it. The trial and price you get are shown at checkout.</li>}
        <li>After the trial, StackedWork costs $49.99 per month (plus any applicable taxes) to keep using. If you haven&apos;t added a payment method by the end of the trial, your subscription ends and you lose access until you subscribe.</li>
        <li>Once you add a payment method, Stripe charges you every month until you cancel. Prices shown at checkout apply.</li>
        <li>You can cancel anytime in <strong>Settings → Manage Billing</strong>, or by emailing us. Questions about charges or refunds: <a href="mailto:ryan@remventures.tech">ryan@remventures.tech</a>.</li>
        <li>If we change the price, we&apos;ll tell you by email before the change affects your bill.</li>
      </ul>

      <h2>Your data</h2>
      <ul>
        <li>You own the information you put into StackedWork. You let us store and process it only to run the service for you. See our <a href="/privacy">Privacy Policy</a>.</li>
        <li>You are responsible for having the right to enter your customers&apos; information and to contact them, including emails you send through StackedWork, such as estimates.</li>
        <li>Keep your own copies of anything important. We work to keep the service reliable, but we can&apos;t promise data will never be lost.</li>
      </ul>

      <h2>AI features</h2>
      <p>
        Voice Entry, receipt scanning, AI price suggestions, and the chat assistant use automated AI and can be wrong. Always check
        names, dates, amounts, and prices before you save or send them. AI output is not professional, legal, tax, or financial advice.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t use StackedWork to send spam, break the law, or violate anyone&apos;s rights.</li>
        <li>Don&apos;t try to access other users&apos; data, overload the service, or get around its security or limits.</li>
        <li>Don&apos;t upload content you don&apos;t have the right to share.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules.</p>

      <h2>Ending your account</h2>
      <p>
        You can stop using StackedWork and cancel at any time. We may end the service or your account with reasonable notice,
        or right away for serious misuse. To have your data deleted, email us (see the Privacy Policy).
      </p>

      <h2>No warranty</h2>
      <p>
        StackedWork is provided &quot;as is&quot; and &quot;as available.&quot; To the extent the law allows, we make no warranties, express or
        implied, including that the service will be uninterrupted or error-free.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent the law allows, REM Ventures is not liable for indirect, incidental, or consequential damages, or for lost
        profits, revenue, or data. Our total liability for any claim about the service is limited to the amount you paid us in the
        12 months before the claim.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms. We&apos;ll change the date above, and if a change is significant, we&apos;ll email account holders.
        If you keep using StackedWork after a change, that means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>REM Ventures: <a href="mailto:ryan@remventures.tech">ryan@remventures.tech</a></p>
    </LegalPage>
  );
}
