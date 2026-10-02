import { NextResponse } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";

/**
 * Server-side auth guard for API routes that spend money (Anthropic) or touch user data.
 * The browser sends the Supabase access token as `Authorization: Bearer <jwt>`; we verify it with
 * Supabase (`auth.getUser(token)`), which also rejects expired/revoked tokens.
 * Returns either the verified user or a ready-to-return 401/500 response.
 */
export async function requireUser(
  request: Request,
  messages: { missing?: string; invalid?: string } = {},
): Promise<{ user: User; token: string; response?: undefined } | { user?: undefined; token?: undefined; response: NextResponse }> {
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return { response: NextResponse.json({ error: messages.missing || "Please sign in to use this feature." }, { status: 401 }) };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { response: NextResponse.json({ error: "Server misconfiguration: missing Supabase env" }, { status: 500 }) };
  }
  try {
    const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) {
      return { response: NextResponse.json({ error: messages.invalid || "Your session expired. Please sign in again." }, { status: 401 }) };
    }
    return { user: data.user, token };
  } catch {
    return { response: NextResponse.json({ error: messages.invalid || "Your session expired. Please sign in again." }, { status: 401 }) };
  }
}
