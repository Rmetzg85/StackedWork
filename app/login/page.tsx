import LoginView from "./LoginClient";

// Server wrapper: picks the variant from the URL so /login?mode=signin renders "Welcome back" in the first paint
// (no signup→signin flash) and ?email= is pre-filled. Everything interactive lives in LoginClient.tsx.
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const initialMode = q.mode === "signin" ? "signin" : "signup";
  const initialEmail = typeof q.email === "string" ? q.email.slice(0, 254) : "";
  return <LoginView initialMode={initialMode} initialEmail={initialEmail} />;
}
