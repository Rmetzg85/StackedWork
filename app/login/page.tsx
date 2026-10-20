import { cookies } from "next/headers";
import type { Metadata } from "next";
import LoginView from "./LoginClient";
import { TRIAL_DAYS, LIST_PRICE } from "../lib/offer";
import { LANG_COOKIE } from "../lib/es-lang";

export const metadata: Metadata = {
  title: "Start Your Free Trial or Sign In",
  description: `Create your StackedWork account with an email and a password: ${TRIAL_DAYS} days free, no credit card, then ${LIST_PRICE}/mo if you add a card.`,
  alternates: { canonical: "https://www.letstaystacked.com/login" },
};

// Server wrapper: picks the variant from the URL so /login?mode=signin renders "Welcome back" in the first paint
// (no signup→signin flash) and ?email= is pre-filled. The sw_lang session cookie (set by the homepage Spanish
// welcome) or ?lang=es renders the form in Spanish. Everything interactive lives in LoginClient.tsx.
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const initialMode = q.mode === "signin" ? "signin" : "signup";
  const initialEmail = typeof q.email === "string" ? q.email.slice(0, 254) : "";
  const stored = (await cookies()).get(LANG_COOKIE)?.value;
  const initialLang = q.lang === "es" || (q.lang !== "en" && stored === "es") ? "es" : "en";
  return <LoginView initialMode={initialMode} initialEmail={initialEmail} initialLang={initialLang} />;
}
