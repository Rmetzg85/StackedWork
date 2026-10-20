import type { Metadata } from "next";

// Not for search results (auth flow / private or internal page). robots.ts also disallows it.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
