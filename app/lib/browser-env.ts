// User-agent checks and messages for voice entry.
// - Instagram/Facebook in-app browsers can't run Web Speech: we don't start recognition there and tell people
//   how to open the page in their real browser (••• on iOS, ⋮ on Android), or to type the job.
// - Real browsers keep specific, actionable messages per failure (no speech, no mic, network, mic denied, ...).
// - Chrome on iPhone fires "service-not-allowed": suggest Safari.
// See /workspace/qa/VOICE-BROWSERS-2026-10-03.md ("Re-test after #63").

/** Instagram / Facebook in-app browsers and Android WebViews ("; wv)"). */
export function isInAppBrowser(ua: string | null | undefined): boolean {
  return /FBAN|FBAV|FB_IAB|FB4A|Instagram|; wv\)/.test(String(ua || ""));
}

const isIos = (ua: string) => /iPhone|iPad|iPod/.test(ua);
const isAndroid = (ua: string) => /Android/i.test(ua);

/** Chrome on iPhone/iPad (CriOS). */
export function isIosChrome(ua: string | null | undefined): boolean {
  const s = String(ua || "");
  return isIos(s) && /CriOS/.test(s);
}

export const VOICE_UNAVAILABLE_MSG = "Open in your browser to use voice, or type the job below.";
export const IN_APP_IOS_MSG = "Open in your browser to use voice (tap ••• → Open in browser), or type the job below.";
export const IN_APP_ANDROID_MSG = "Open in your browser to use voice (tap ⋮ → Open in Chrome), or type the job below.";
export const FIREFOX_MSG = "Voice entry isn't supported in Firefox yet. Open in Chrome or Safari, or type the job below.";
export const NO_SR_MSG = "Voice entry isn't supported in this browser. Open in Chrome or Safari, or type the job below.";
export const NO_SPEECH_MSG = "Didn't catch that, try again or type it below.";
export const NO_MIC_MSG = "No microphone found. Check that a microphone is connected, or type the job below.";
export const NETWORK_MSG = "Voice recognition needs an internet connection. Check your connection, or type the job below.";
export const MIC_BLOCKED_MSG = "Microphone access is blocked. Allow microphone access for this site in your browser settings, then tap Voice Entry again. You can also type the job below.";
export const IOS_CHROME_VOICE_MSG = "Voice doesn't work in Chrome on iPhone. Open this page in Safari to use voice, or type the job below.";
export const SERVICE_BLOCKED_MSG = "Speech recognition isn't available in this browser right now. Try Chrome or Safari, or type the job below.";
export const START_FAILED_MSG = "Couldn't start the microphone. Try again, or type the job below.";
export const STOPPED_MSG = "Voice entry stopped unexpectedly. Try again, or type the job below.";

/** In-app browser text, with the right "open in browser" hint for the platform. */
export function inAppMessage(ua: string | null | undefined): string {
  const s = String(ua || "");
  return isIos(s) ? IN_APP_IOS_MSG : isAndroid(s) ? IN_APP_ANDROID_MSG : VOICE_UNAVAILABLE_MSG;
}

/**
 * What to show when voice entry fails.
 * `kind`: "no-sr" (no SpeechRecognition), "empty" (ended with nothing heard), "start-failed" (start() threw),
 * or a SpeechRecognition error code ("no-speech", "audio-capture", "network", "not-allowed", "service-not-allowed", ...).
 * "aborted" is ignored by the caller.
 */
export function voiceMessage(kind: string | null | undefined, ua: string | null | undefined): string {
  const s = String(ua || "");
  if (isInAppBrowser(s)) return inAppMessage(s);
  switch (kind) {
    case "no-sr": return /firefox|fxios/i.test(s) ? FIREFOX_MSG : NO_SR_MSG;
    case "empty":
    case "no-speech": return NO_SPEECH_MSG;
    case "audio-capture": return NO_MIC_MSG;
    case "network": return NETWORK_MSG;
    case "not-allowed": return MIC_BLOCKED_MSG;
    case "service-not-allowed": return isIosChrome(s) ? IOS_CHROME_VOICE_MSG : SERVICE_BLOCKED_MSG;
    case "start-failed": return START_FAILED_MSG;
    default: return STOPPED_MSG;
  }
}
