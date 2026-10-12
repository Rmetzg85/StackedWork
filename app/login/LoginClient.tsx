"use client";
import { useState, useEffect, useRef } from "react";
import { saveLangChoice } from "../lib/es-lang";
import { createClient } from "@supabase/supabase-js";
import { captureFirstTouch, getFirstTouch } from "../lib/first-touch";
import { useFounderOffer } from "../lib/use-founder-offer";
import { trialDays, LIST_PRICE } from "../lib/offer";
import { friendlyAuthError, isExistingAccountSignup, type AuthErrorAction } from "../lib/auth-errors";
import { funnel } from "../lib/funnel";
import Honeypot from "../components/Honeypot";
import { HONEYPOT_FIELD } from "../lib/honeypot-field";

const G = "#C8E64A";
const GD = "#A8C435";

// Env only (set in Vercel and .env.production). No hard-coded fallback: the old one pointed at a different Supabase project.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Implicit flow so the confirmation link signs the user in on any device (PKCE needs the original browser).
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true } });
// Email-confirmation redirect. Must be listed in Supabase Auth → URL Configuration → Redirect URLs.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.letstaystacked.com").replace(/\/+$/, "");
const CONFIRM_REDIRECT = `${SITE_URL}/?firstrun=1`;

type Mode = "signin" | "signup" | "forgot";
type Lang = "en" | "es";

function LoginForm({ initialMode, initialEmail, lang, onEnglish }: { initialMode: "signin" | "signup"; initialEmail: string; lang: Lang; onEnglish: () => void }) {
  // Spanish (yard-sign / Spanish browser, chosen on the homepage) covers the offer, labels, buttons and hints.
  // Auth error messages stay in English (app/lib/auth-errors.ts).
  const es = lang === "es";
  const x = (en: string, sp: string) => (es ? sp : en);
  const founder = useFounderOffer();
  // The server (app/login/page.tsx) reads ?mode= and ?email=, so the right variant is in the first paint:
  // no empty card, no signup→signin flash.
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState(initialEmail);
  // Until React has hydrated, the submit button is disabled: a tap (or Enter) before then would otherwise do a
  // native form submit and reload the page, wiping what was typed.
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const [errorAction, setErrorAction] = useState<AuthErrorAction>(null);
  const [resent, setResent] = useState(false);
  // Set by a real keypress/tap in the form. A filled honeypot only counts as a bot when nobody typed:
  // some password managers/autofill fill every text field, and a real person must never get a fake success.
  const human = useRef(false);
  const markHuman = (e: { isTrusted: boolean }) => { if (e.isTrusted) human.current = true; };

  useEffect(() => {
    setReady(true);
    funnel(initialMode === "signup" ? "signup_view" : "signin_view");
    // Ads may link straight to /login — capture first-touch UTM here too (no-op if already stored).
    captureFirstTouch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearMsgs = () => { setError(null); setErrorAction(null); setSuccess(null); setResent(false); };
  const switchMode = (m: Mode) => { setMode(m); clearMsgs(); };

  const resendConfirmation = async () => {
    const addr = email.trim();
    if (!addr) { setError(x("Enter your email above, then tap resend.", "Escriba su correo arriba y luego toque reenviar.")); return; }
    setLoading(true);
    try {
      const { error: rErr } = await supabase.auth.resend({ type: "signup", email: addr, options: { emailRedirectTo: CONFIRM_REDIRECT } });
      if (rErr) throw rErr;
      funnel("signup_resend");
      setError(null); setErrorAction(null); setResent(true);
      setSuccess(x(`Sent again to ${addr}. It can take a minute. Check spam or Promotions too.`, `Se envió de nuevo a ${addr}. Puede tardar un minuto. Revise también spam o Promociones.`));
    } catch (err) {
      const f = friendlyAuthError(err, "signup"); setError(f.message); setErrorAction(f.action === "resend" ? null : f.action);
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMsgs();
    setLoading(true);

    try {
      if (mode === "signup") {
        funnel("signup_submit");
        // Honeypot filled and nobody typed = bot: show the normal message and create nothing (no auth user, no email).
        if (hp.trim() && !human.current) {
          funnel("signup_honeypot");
          setResent(true); // no "resend" offer on the fake success
          setSuccess(x(`Check your email to confirm your account. We sent a confirmation link to ${email.trim()}.`, `Revise su correo para confirmar su cuenta. Enviamos un enlace de confirmación a ${email.trim()}.`));
          return;
        }
        // Short signup: email + password only. Username is derived from the email
        // (editable later in Settings); phone/website are collected later.
        const cleanEmail = email.trim();
        const username = (cleanEmail.split("@")[0] || "").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 30);
        const firstTouch = getFirstTouch();
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { username, ...firstTouch },
            // "Confirm email" is ON: the confirmation link lands on the first-run screen (any device).
            emailRedirectTo: CONFIRM_REDIRECT,
          },
        });
        if (signUpError) throw signUpError;

        // Already registered (Supabase hides this behind a "success" with no identities): send them to sign in.
        if (isExistingAccountSignup(signUpData)) {
          funnel("signup_existing_account");
          setMode("signin");
          setError(x("You already have an account with this email. Sign in below, or tap \u201cForgot password?\u201d.", "Ya tiene una cuenta con este correo. Inicie sesión abajo o toque \u201c¿Olvidó su contraseña?\u201d."));
          return;
        }

        // First-run flag (same-device fallback; the confirm link's ?firstrun=1 covers other devices).
        try { window.localStorage.setItem("sw_firstrun", "1"); window.localStorage.setItem("sw_signup_email", cleanEmail); } catch { /* ignore */ }

        // No session = email confirmation required. Say so clearly before moving on to start the trial.
        const needsConfirm = !signUpData?.session;
        if (needsConfirm) {
          setSuccess(x(`Check your email to confirm your account. We sent a confirmation link to ${cleanEmail}. Starting your free trial…`, `Revise su correo para confirmar su cuenta. Enviamos un enlace de confirmación a ${cleanEmail}. Iniciando su prueba gratis…`));
        }
        const shownAt = Date.now();
        funnel("signup_created", { needs_confirm: needsConfirm });

        // Notify Ryan of new signup
        await fetch("/api/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // A person typed here, so an autofilled honeypot must not suppress the owner notification.
          body: JSON.stringify({ username, email: cleanEmail, ...firstTouch, [HONEYPOT_FIELD]: human.current ? "" : hp }),
        }).catch(() => {});

        // After signup, send them to Stripe checkout (no card needed for the trial).
        // The account already exists at this point, so a checkout problem must not look like a failed signup.
        let checkoutUrl: string | null = null;
        try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          // With a session (email confirmation off) the server can link the subscription to this user id.
          headers: {
            "Content-Type": "application/json",
            ...(signUpData?.session?.access_token ? { Authorization: `Bearer ${signUpData.session.access_token}` } : {}),
          },
          body: JSON.stringify({ email: cleanEmail, utm: firstTouch }),
        });
        const data = await res.json().catch(() => ({}));
        checkoutUrl = typeof data?.url === "string" ? data.url : null;
        } catch { checkoutUrl = null; }
        if (checkoutUrl) {
          funnel("signup_checkout_redirect");
          // Keep the "check your email" message on screen long enough to read.
          if (needsConfirm) await new Promise(r => setTimeout(r, Math.max(0, 2500 - (Date.now() - shownAt))));
          window.location.href = checkoutUrl;
        } else {
          funnel("signup_checkout_error");
          setSuccess(needsConfirm
            ? x(`Your account is created. Check your email (${cleanEmail}) and tap the confirmation link. You'll start your free trial from the app right after. Still no card.`, `Su cuenta está creada. Revise su correo (${cleanEmail}) y toque el enlace de confirmación. Después podrá empezar su prueba gratis desde la aplicación. Sigue sin tarjeta.`)
            : x("Your account is created. Open the app to start your free trial. Still no card.", "Su cuenta está creada. Abra la aplicación para empezar su prueba gratis. Sigue sin tarjeta."));
        }
      } else if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (resetError) throw resetError;
        setSuccess(x("Password reset email sent! Check your inbox.", "¡Listo! Le enviamos un correo para restablecer su contraseña. Revise su bandeja de entrada."));
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        window.location.href = "/";
      }
    } catch (err: any) {
      const f = friendlyAuthError(err, mode);
      funnel(mode === "signup" ? "signup_error" : mode === "signin" ? "signin_error" : "reset_error", { code: f.code });
      setError(f.message);
      setErrorAction(f.action);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tabs */}
      {mode !== "forgot" && (
        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            className="tab"
            onClick={() => switchMode("signup")}
            style={{
              color: mode === "signup" ? G : "rgba(245,240,235,0.7)",
              borderBottomColor: mode === "signup" ? G : "transparent",
            }}
          >
            {x("Sign Up", "Crear cuenta")}
          </button>
          <button
            className="tab"
            onClick={() => switchMode("signin")}
            style={{
              color: mode === "signin" ? G : "rgba(245,240,235,0.7)",
              borderBottomColor: mode === "signin" ? G : "transparent",
            }}
          >
            {x("Sign In", "Iniciar sesión")}
          </button>
        </div>
      )}

      <div style={{ padding: "28px 28px 32px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          {mode === "signup" ? x("Start your free trial", "Empiece su prueba gratis") : mode === "signin" ? x("Welcome back", "Bienvenido de nuevo") : x("Reset your password", "Restablecer su contraseña")}
        </h1>
        {mode === "signup" ? (
          <div data-testid="signup-offer" style={{ margin: "10px 0 22px", padding: "12px 14px", background: "rgba(200,230,74,0.10)", border: "1px solid rgba(200,230,74,0.4)", borderRadius: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: G, lineHeight: 1.3 }}>
              {!es && founder.active && founder.headline ? founder.headline : x(`${trialDays(founder)} days free \u00b7 No credit card`, `${trialDays(founder)} días gratis \u00b7 Sin tarjeta de crédito`)}
            </div>
            <div style={{ fontSize: 13, color: "rgba(245,240,235,0.85)", marginTop: 4, lineHeight: 1.5 }}>
              {!es && founder.active && founder.sub ? founder.sub : x(`Then ${LIST_PRICE}/mo only if you add a card. If you don't, the trial just ends. Nothing to cancel.`, `Después ${LIST_PRICE}/mes solo si agrega una tarjeta. Si no, la prueba simplemente termina. No hay nada que cancelar.`)}
            </div>
            {es && <div style={{ fontSize: 12, color: "rgba(245,240,235,0.7)", marginTop: 6 }}>La aplicación está en inglés por ahora.</div>}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "rgba(245,240,235,0.7)", marginBottom: 24 }}>
            {mode === "signin" ? x("Sign in to access your StackedWork dashboard.", "Inicie sesión para entrar a su panel de StackedWork.") : x("Enter your email and we'll send you a reset link.", "Escriba su correo y le enviaremos un enlace para restablecer su contraseña.")}
          </p>
        )}

        {/* method="post" + no name on email/password: even a native (pre-hydration) submit can never put the
            email or password in a URL. The button is also disabled until hydration, which blocks Enter too. */}
        <form method="post" onSubmit={handleSubmit} onKeyDownCapture={markHuman} onPointerDownCapture={markHuman} style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
          {mode === "signup" && <Honeypot value={hp} onChange={setHp} />}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(245,240,235,0.7)", marginBottom: 6 }}>
              {x("Email", "Correo electrónico")}
            </label>
            <input
              className="auth-input"
              type="email"
              placeholder={x("you@example.com", "usted@ejemplo.com")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "rgba(245,240,235,0.7)", marginBottom: 6 }}>
                {x("Password", "Contraseña")}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? x("At least 6 characters", "Mínimo 6 caracteres") : x("Your password", "Su contraseña")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 2,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 44,
                    height: 44,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(245,240,235,0.6)",
                    fontSize: 15,
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label={showPassword ? x("Hide password", "Ocultar contraseña") : x("Show password", "Mostrar contraseña")}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          )}

          {mode === "signin" && (
            <div style={{ textAlign: "right", marginTop: -6 }}>
              <span
                onClick={() => switchMode("forgot")}
                style={{ fontSize: 12, color: G, cursor: "pointer", fontWeight: 500 }}
              >
                {x("Forgot password?", "¿Olvidó su contraseña?")}
              </span>
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 13, color: "#FCA5A5" }}>
              {error}
              {errorAction && (
                <div style={{ marginTop: 8 }}>
                  <button type="button" className="msg-action"
                    onClick={() => errorAction === "resend" ? resendConfirmation() : switchMode(errorAction === "signin" ? "signin" : "forgot")}>
                    {errorAction === "signin" ? x("Sign in instead", "Iniciar sesión") : errorAction === "forgot" ? x("Reset my password", "Restablecer mi contraseña") : x("Resend confirmation email", "Reenviar correo de confirmación")}
                  </button>
                </div>
              )}
            </div>
          )}

          {success && (
            <div style={{ padding: "10px 14px", background: "rgba(200,230,74,0.1)", border: "1px solid rgba(200,230,74,0.3)", borderRadius: 8, fontSize: 13, color: G }}>
              {success}
              {mode === "signup" && !resent && !loading && /Check your email|Revise su correo/.test(success) && (
                <div style={{ marginTop: 8, color: "rgba(245,240,235,0.75)" }}>
                  {x("Not there in a minute? Check spam or Promotions, or", "¿No llega en un minuto? Revise spam o Promociones, o")}{" "}
                  <button type="button" className="msg-action" onClick={resendConfirmation}>{x("resend it", "reenvíelo")}</button>.
                </div>
              )}
            </div>
          )}

          <button className="auth-btn" type="submit" disabled={loading || !ready} style={{ marginTop: 4 }}>
            {loading
              ? (mode === "signup" ? x("Creating account...", "Creando cuenta...") : mode === "signin" ? x("Signing in...", "Iniciando sesión...") : x("Sending...", "Enviando..."))
              : (mode === "signup" ? x("Create Account & Start Trial", "Crear cuenta y empezar prueba") : mode === "signin" ? x("Sign In", "Iniciar sesión") : x("Send Reset Link", "Enviar enlace"))}
          </button>
          {mode === "signup" && !success && (
            <p style={{ fontSize: 12, color: "rgba(245,240,235,0.65)", textAlign: "center", lineHeight: 1.5, marginTop: -2 }}>
              {es
                ? <>Siguiente: en una página segura de Stripe, toque &ldquo;Start trial&rdquo; (sin tarjeta) y luego confirme su correo.</>
                : <>Next: tap &ldquo;Start trial&rdquo; on a secure Stripe page (no card), then confirm your email.</>}
            </p>
          )}
        </form>

        {mode === "forgot" && (
          <p style={{ marginTop: 18, fontSize: 13, color: "rgba(245,240,235,0.35)", textAlign: "center" }}>
            <span
              onClick={() => switchMode("signin")}
              style={{ color: G, cursor: "pointer", fontWeight: 500 }}
            >
              {x("← Back to sign in", "← Volver a iniciar sesión")}
            </span>
          </p>
        )}

        {mode === "signup" && (
          <p style={{ marginTop: 18, fontSize: 11, color: "rgba(245,240,235,0.6)", textAlign: "center", lineHeight: 1.5 }}>
            {x("By signing up you agree to our", "Al registrarse acepta nuestros")} <a href="/terms" style={{ color: "rgba(245,240,235,0.8)", textDecoration: "underline" }}>{x("Terms of Service", "Términos del servicio")}</a> {x("and", "y")} <a href="/privacy" style={{ color: "rgba(245,240,235,0.8)", textDecoration: "underline" }}>{x("Privacy Policy", "Política de privacidad")}</a>.
          </p>
        )}

        {es && (
          <p style={{ marginTop: 10, textAlign: "center" }}>
            <button type="button" lang="en" data-testid="es-dismiss" onClick={onEnglish} className="msg-action" style={{ fontSize: 12, color: "rgba(245,240,235,0.75)", fontWeight: 500, padding: "8px 10px" }}>
              View in English
            </button>
          </p>
        )}
      </div>
    </>
  );
}

export default function LoginView({ initialMode, initialEmail, initialLang = "en" }: { initialMode: "signin" | "signup"; initialEmail: string; initialLang?: Lang }) {
  // initialLang comes from the sw_lang session cookie (set on the homepage), read on the server: no flash.
  const [lang, setLang] = useState<Lang>(initialLang);
  return (
    <main
      lang={lang}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#132440",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: "#F5F0EB",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Space+Mono:wght@400;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        .auth-input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #F5F0EB;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s;
          -webkit-appearance: none;
          appearance: none;
        }
        .auth-input::placeholder { color: rgba(245,240,235,0.3); }
        .auth-input:focus { border-color: ${G}; background: rgba(255,255,255,0.08); }
        .auth-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, ${G}, ${GD});
          color: #132440;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .auth-btn:hover { opacity: 0.9; }
        .auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .msg-action { background: none; border: none; padding: 0; color: ${G}; font: inherit; font-weight: 600; text-decoration: underline; cursor: pointer; }
        .tab {
          flex: 1;
          padding: 10px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
      `}</style>

      {/* Logo */}
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, textDecoration: "none" }}>
        <div style={{ width: 36, height: 36, background: "#4A82C4", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "-0.03em" }}>SW</div>
        <span style={{ fontWeight: 700, fontSize: 18, color: "#F5F0EB", letterSpacing: "-0.02em" }}>StackedWork</span>
      </a>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <LoginForm initialMode={initialMode} initialEmail={initialEmail} lang={lang} onEnglish={() => { saveLangChoice("en"); setLang("en"); }} />
      </div>

      <a href="/" style={{ marginTop: 24, fontSize: 13, color: "rgba(245,240,235,0.6)", textDecoration: "none" }}>
        {lang === "es" ? "← Volver al inicio" : "← Back to home"}
      </a>
    </main>
  );
}
