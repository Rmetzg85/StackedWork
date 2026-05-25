import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
    title: "StackedWork - CRM for Contractors",
    description: "AI-powered CRM, photo mockups, lead tracking, and revenue dashboards for contractors.",
    metadataBase: new URL("https://letstaystacked.com"),
    openGraph: {
          title: "StackedWork - CRM for Contractors",
          description: "Job tracking, lead management, before & after portfolio, and revenue dashboards. Built for contractors. $49.99/mo.",
          url: "https://letstaystacked.com",
          siteName: "StackedWork",
          type: "website",
    },
    twitter: {
          card: "summary",
          title: "StackedWork - CRM for Contractors",
          description: "Job tracking, lead management, before & after portfolio, and revenue dashboards. Built for contractors. $49.99/mo.",
    },
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
                        </Script>Script>
                </body>body>
          </html>html>
        );
}</html>
