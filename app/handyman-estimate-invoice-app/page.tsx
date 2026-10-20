import LandingPageView, { landingMetadata } from "../components/LandingPageView";

export const metadata = landingMetadata("handyman-estimate-invoice-app");

export default function Page() {
  return <LandingPageView slug="handyman-estimate-invoice-app" />;
}
