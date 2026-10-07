// Plain-language versions of Supabase Auth errors for the signup / sign-in form.
// `action` tells the form what to offer next (switch to sign in, resend the confirmation email, reset password).

export type AuthErrorAction = "signin" | "resend" | "forgot" | null;
export type FriendlyAuthError = { message: string; action: AuthErrorAction; code: string };

export function friendlyAuthError(err: unknown, mode: "signup" | "signin" | "forgot"): FriendlyAuthError {
  const e = (err || {}) as { message?: string; code?: string; status?: number; name?: string };
  const raw = String(e.message || "").trim();
  const code = String(e.code || "").trim();
  const m = raw.toLowerCase();
  const out = (message: string, action: AuthErrorAction, c: string): FriendlyAuthError => ({ message, action, code: c });

  if (code === "user_already_exists" || code === "email_exists" || /already registered|already been registered|already exists/.test(m))
    return out("You already have an account with this email. Sign in instead, or reset your password if you forgot it.", "signin", "already_registered");
  if (code === "over_email_send_rate_limit" || /email rate limit/.test(m))
    return out("We're sending a lot of emails right now and hit our limit. Please try again in a few minutes. Your spot isn't lost.", null, "email_rate_limit");
  if (code === "over_request_rate_limit" || /only request this after|too many requests|rate limit/.test(m))
    return out("Too many tries in a short time. Wait a minute, then try again.", null, "request_rate_limit");
  if (code === "email_not_confirmed" || /email not confirmed/.test(m))
    return out("Please confirm your email first. Check your inbox (and spam or Promotions) for the confirmation link, or resend it.", "resend", "email_not_confirmed");
  if (code === "invalid_credentials" || /invalid login credentials/.test(m))
    return out("That email and password don't match. Try again, or reset your password.", "forgot", "invalid_credentials");
  if (code === "weak_password" || /password should be|password is too weak|weak password/.test(m))
    return out("Please use a password with at least 6 characters.", null, "weak_password");
  if (code === "email_address_invalid" || code === "validation_failed" || /unable to validate email|invalid format|email address .* is invalid|invalid email/.test(m))
    return out("That email address doesn't look right. Check for typos (for example gmail.com).", null, "invalid_email");
  if (code === "signup_disabled" || /signups not allowed/.test(m))
    return out("New signups are paused for a moment. Please try again later or email us.", null, "signup_disabled");
  if (/error sending (confirmation|recovery|magic link)|sending.*email/.test(m))
    return out("Your account may have been created, but we couldn't send the confirmation email. Try resending it in a minute.", "resend", "email_send_failed");
  if (e.name === "TypeError" || /failed to fetch|network|load failed|timed out|timeout/.test(m))
    return out("Couldn't reach our server. Check your connection and try again.", null, "network");
  return out(raw || (mode === "signup" ? "Something went wrong creating your account. Please try again." : "Something went wrong. Please try again."), null, code || "unknown");
}

/** Supabase (email-enumeration protection on) answers signUp for an already-registered email with a user that has no identities. */
export function isExistingAccountSignup(data: { user?: { identities?: unknown[] | null } | null } | null | undefined): boolean {
  const ids = data?.user?.identities;
  return Array.isArray(ids) && ids.length === 0;
}
