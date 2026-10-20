import LandingPageView, { landingMetadata } from "../components/LandingPageView";

export const metadata = landingMetadata("free-contractor-invoice-app");

export default function Page() {
  return <LandingPageView slug="free-contractor-invoice-app" />;
}
