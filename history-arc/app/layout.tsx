import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Human Record — 2,500 Years of War, Conquest & Slavery",
  description:
    "An interactive arc diagram visualizing documented wars, conquests, slavery systems, and atrocities across world history — every continent, every era.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
