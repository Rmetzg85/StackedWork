import { redirect } from "next/navigation";

/** Advertise / marketplace placement temporarily off — homepage lock redirects home. */
export default function AdvertiseRedirect() {
  redirect("/");
}
