import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StackedWork - CRM for Contractors",
  description: "AI-powered CRM, photo mockups, lead tracking, and revenue dashboards for contractors.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
