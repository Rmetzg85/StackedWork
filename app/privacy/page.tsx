import type { Metadata } from "next";
import LegalPage from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | StackedWork",
  description: "What StackedWork collects, why, and who helps us run the service.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2, 2026">
      <p>
        StackedWork (letstaystacked.com) is a job-tracking app for small contractors. It is run by REM Ventures
        (&quot;we&quot;, &quot;us&quot;). This page explains, in plain terms, what we collect, why, and which outside services handle it.
        Questions: <a href="mailto:ryan@remventures.tech">ryan@remventures.tech</a>.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Your account:</strong> your email address and password. Passwords are handled by our authentication provider (Supabase), and we never see them in plain text. We create a username from your email.</li>
        <li><strong>Profile details you choose to add:</strong> name or business name, trade, service area, and phone number.</li>
        <li><strong>Business data you enter:</strong> jobs, customers, and their contact details, addresses, prices, notes, estimates and line items, leads, receipts and expense amounts, and before/after photos. You decide what goes in. This includes information about <em>your</em> customers, so please enter only what you need to run the job.</li>
        <li><strong>Leads sent to you:</strong> when someone fills out your lead form, we store the name, phone, email, and message they submit so you can see them.</li>
        <li><strong>Voice entry:</strong> when you use Voice Entry, your browser turns speech into text (in Chrome, for example, the browser&apos;s own speech service does this). We receive only the text, not audio, and send it to our AI provider to fill in the job form.</li>
        <li><strong>Billing:</strong> Stripe handles subscriptions and payments. We get your Stripe customer ID, subscription status, plan, and trial or billing dates. We never receive or store card numbers.</li>
        <li><strong>Where you came from:</strong> if you arrive from a link with campaign tags (utm_source, utm_medium, utm_campaign, trade), we save those tags with your account and subscription so we know which marketing works.</li>
        <li><strong>Usage and device data:</strong> pages visited, referrer, browser and device type, and approximate location from your IP address, collected by Vercel Web Analytics and Google Analytics.</li>
        <li><strong>Chat:</strong> messages you type into the AI assistant on our site.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run the app: show your jobs, estimates, leads, receipts, and photos, and email estimates to your customers when you ask us to.</li>
        <li>To manage your trial and subscription.</li>
        <li>To contact you about your account. We get an email when someone signs up or a subscription changes, so we may reach out to help you get set up.</li>
        <li>To understand and improve the product (analytics).</li>
      </ul>
      <p>We do not sell your personal information or your customers&apos; information.</p>

      <h2>Services that process data for us</h2>
      <ul>
        <li><strong>Supabase:</strong> database, sign-in, and file storage (your account, business data, photos, and receipts).</li>
        <li><strong>Vercel:</strong> hosts the website and app, and provides Vercel Web Analytics.</li>
        <li><strong>Stripe:</strong> subscriptions and payments.</li>
        <li><strong>Anthropic:</strong> powers the AI features: the chat assistant, Voice Entry job parsing, receipt scanning (the receipt image is sent), and AI price suggestions on estimates. Only the text or image needed for that feature is sent.</li>
        <li><strong>Resend:</strong> sends emails, such as estimates you send to customers and account notices.</li>
        <li><strong>Google Analytics:</strong> website usage statistics.</li>
      </ul>
      <p>These companies handle data under their own terms and privacy policies.</p>

      <h2>Things to know about sharing</h2>
      <ul>
        <li><strong>Photos and receipt files</strong> you upload are stored at web links. Anyone who has a file&apos;s link can open it. When you share a photo to social media, it becomes public on that platform.</li>
        <li><strong>Estimates</strong> you send include a private link. Anyone who has that link can view the estimate.</li>
        <li>We may disclose information if the law requires it.</li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>
        We use your browser&apos;s storage to keep you signed in, remember campaign tags from your first visit, and
        remember whether you&apos;ve seen the first-run screen. Google Analytics sets its own cookies. You can clear these
        in your browser settings, but you will be signed out.
      </p>

      <h2>Keeping and deleting data</h2>
      <p>
        We keep your data while your account is open. You can delete individual jobs, estimates, photos, and receipts
        in the app. To close your account and delete your data, email <a href="mailto:ryan@remventures.tech">ryan@remventures.tech</a> from
        your account email. Stripe keeps its own billing records as required by law.
      </p>

      <h2>Security</h2>
      <p>
        Your data is sent over HTTPS. Database access rules limit each signed-in user to their own records.
        No system is perfectly secure, so please use a strong password that you don&apos;t use anywhere else.
      </p>

      <h2>Children</h2>
      <p>StackedWork is a business tool for adults. It is not meant for anyone under 18.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we&apos;ll update this page and its date. If a change is significant, we&apos;ll email account holders.</p>

      <h2>Contact</h2>
      <p>REM Ventures: <a href="mailto:ryan@remventures.tech">ryan@remventures.tech</a></p>
    </LegalPage>
  );
}
