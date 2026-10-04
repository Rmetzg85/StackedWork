// User-agent checks for voice entry. Web Speech doesn't work in Instagram/Facebook in-app
// browsers, and Chrome on iPhone fires "service-not-allowed". We don't try to make voice work
// there; we point people to a real browser or the typed box.
// See /workspace/qa/VOICE-BROWSERS-2026-10-03.md.

/** Instagram / Facebook in-app browsers and Android WebViews ("; wv)"). */
export function isInAppBrowser(ua: string | null | undefined): boolean {
  return /FBAN|FBAV|FB_IAB|FB4A|Instagram|; wv\)/.test(String(ua || ""));
}

/** Chrome on iPhone/iPad (CriOS). */
export function isIosChrome(ua: string | null | undefined): boolean {
  const s = String(ua || "");
  return /iPhone|iPad|iPod/.test(s) && /CriOS/.test(s);
}

export const VOICE_UNAVAILABLE_MSG = "Open in your browser to use voice, or type the job below.";
export const MIC_BLOCKED_MSG = "Microphone access is blocked. Allow microphone access for this site in your browser settings, then tap Voice Entry again. You can also type the job below.";
export const IOS_CHROME_VOICE_MSG = "Voice doesn't work in Chrome on iPhone. Open this page in Safari to use voice, or type the job below.";

/** Message for a recognition error code (or null for no SpeechRecognition at all). "aborted" is ignored by the caller. */
export function voiceErrorMessage(code: string | null, ua: string | null | undefined): string {
  if (code === "service-not-allowed" && isIosChrome(ua) && !isInAppBrowser(ua)) return IOS_CHROME_VOICE_MSG;
  // The user denied mic permission in a normal browser: the site setting is the fix.
  if (code === "not-allowed" && !isInAppBrowser(ua)) return MIC_BLOCKED_MSG;
  return VOICE_UNAVAILABLE_MSG;
}
