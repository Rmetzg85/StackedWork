import { redirect } from "next/navigation";

/** Marketplace temporarily off — homepage lock redirects to marketing home. */
export default function FindContractorRedirect() {
  redirect("/");
}
