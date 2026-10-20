import LandingPageView, { landingMetadata } from "../components/LandingPageView";

export const metadata = landingMetadata("estimate-app-for-contractors");

export default function Page() {
  return <LandingPageView slug="estimate-app-for-contractors" />;
}
