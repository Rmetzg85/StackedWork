import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import JsonLd from "./components/JsonLd";
import { softwareApplicationLd } from "./lib/seo";
import { SITE_URL } from "./lib/site";

// Server wrapper so the homepage can export metadata and JSON-LD; the page itself is unchanged (HomeClient).
export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/` },
};

export default function Page() {
  return (
    <>
      <JsonLd data={softwareApplicationLd()} />
      <HomeClient />
    </>
  );
}
