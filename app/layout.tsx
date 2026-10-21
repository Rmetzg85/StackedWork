import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "./lib/site";
import { TRIAL_DAYS, LIST_PRICE } from "./lib/offer";

const DEFAULT_TITLE = `StackedWork: Estimates, Invoices and Job Tracking for Contractors`;
const DEFAULT_DESC = `Log jobs by voice, send estimates as a link, and turn them into invoices from your phone. ${TRIAL_DAYS}-day free trial, no credit card, then ${LIST_PRICE}/mo.`;
// Google Search Console HTML-tag verification: set NEXT_PUBLIC_GSC_VERIFICATION to the content="" value Google gives you.
const GSC = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: { default: DEFAULT_TITLE, template: "%s | StackedWork" },
    description: DEFAULT_DESC,
    applicationName: "StackedWork",
    openGraph: {
          title: DEFAULT_TITLE,
          description: DEFAULT_DESC,
          url: `${SITE_URL}/`,
          siteName: "StackedWork",
          type: "website",
          locale: "en_US",
          images: [{ url: "/og.png", width: 1200, height: 630, alt: "StackedWork: estimates and invoices from your phone" }],
    },
    twitter: {
          card: "summary_large_image",
          title: DEFAULT_TITLE,
          description: DEFAULT_DESC,
          images: ["/og.png"],
    },
    ...(GSC ? { verification: { google: GSC } } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
          <html lang="en">
                <body>
                  {children}
                        <Analytics />
                        <Script
                                    src="https://www.googletagmanager.com/gtag/js?id=G-MF35DJK57X"
                                    strategy="afterInteractive"
                                  />
                        <Script id="google-analytics" strategy="afterInteractive">
                          {`
                                      window.dataLayer = window.dataLayer || [];
                                                  function gtag(){dataLayer.push(arguments);}
                                                              gtag('js', new Date());
                                                                          gtag('config', 'G-MF35DJK57X');
                                                                                    `}
                        </Script>
                </body>
          </html>
        );
}
