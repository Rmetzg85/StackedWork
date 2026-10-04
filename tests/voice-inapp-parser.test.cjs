// Voice in-app browsers + parser fixes (QA VOICE-BROWSERS-2026-10-03). Run: npm run test:parser
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseVoiceToJobLocal, jobTypeFromText, isGutterCleaning, bumpSameWeekday } = require("../.tmp-test/lib/parse-job-local.js");
const E = require("../.tmp-test/lib/browser-env.js");
const { isInAppBrowser, isIosChrome, voiceMessage } = E;

const SAT = "2026-10-03"; // a Saturday

test("gutter cleaning is General, not Roofing", () => {
  for (const t of ["gutter cleaning", "Dana Price, 44 Elm St, gutter cleaning Saturday 10am, 250 dollars", "clean out the gutters", "gutters cleaned"]) {
    assert.equal(jobTypeFromText(t), "General", t);
    assert.equal(parseVoiceToJobLocal(t, SAT).jobType, "General", t);
  }
  assert.ok(isGutterCleaning("Clean the gutters"));
  assert.equal(jobTypeFromText("gutter install"), "Roofing");
  assert.equal(jobTypeFromText("gutter repair"), "Roofing");
  assert.equal(jobTypeFromText("roof repair and gutter cleaning"), "Roofing");
  assert.equal(jobTypeFromText("shingle replacement"), "Roofing");
});

test("QA typed phrase on a Saturday: next Saturday, 10am, $250, General", () => {
  const p = parseVoiceToJobLocal("Dana Price, 44 Elm St, gutter cleaning Saturday 10am, 250 dollars", SAT);
  assert.equal(p.name, "Dana Price"); assert.equal(p.address, "44 Elm St");
  assert.equal(p.date, "2026-10-10"); assert.equal(p.time, "10:00"); assert.equal(p.value, "250"); assert.equal(p.jobType, "General");
});

test("a weekday said on that weekday means next week, for every weekday (America/New_York)", () => {
  const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  // 2026-10-04 is a Sunday; walk a full week.
  for (let i = 0; i < 7; i++) {
    const today = `2026-10-${String(4 + i).padStart(2, "0")}`;
    const next = `2026-10-${String(11 + i).padStart(2, "0")}`;
    const name = WD[i][0].toUpperCase() + WD[i].slice(1);
    assert.equal(parseVoiceToJobLocal(`Ann Lee deck stain ${name}`, today).date, next, `${name} on ${today}`);
    assert.equal(parseVoiceToJobLocal(`Ann Lee deck stain on ${name}`, today).date, next);
    assert.equal(parseVoiceToJobLocal(`Ann Lee deck stain next ${name}`, today).date, next);
    assert.equal(parseVoiceToJobLocal(`Ann Lee deck stain this ${name}`, today).date, today, "this <weekday> keeps today");
  }
  // Other weekdays are unchanged: Monday said on a Saturday is 2 days out.
  assert.equal(parseVoiceToJobLocal("Ann Lee deck stain Monday", SAT).date, "2026-10-05");
  assert.equal(parseVoiceToJobLocal("Ann Lee deck stain today", SAT).date, SAT);
});

test("AI guard: bumpSameWeekday", () => {
  assert.equal(bumpSameWeekday("2026-10-03T10:00", "gutter cleaning Saturday 10am", SAT), "2026-10-10T10:00");
  assert.equal(bumpSameWeekday("2026-10-03", "saturday", SAT), "2026-10-10");
  assert.equal(bumpSameWeekday("2026-10-03T10:00", "this Saturday 10am", SAT), "2026-10-03T10:00");
  assert.equal(bumpSameWeekday("2026-10-03T10:00", "today at 10, Saturday crew", SAT), "2026-10-03T10:00");
  assert.equal(bumpSameWeekday("2026-10-03T10:00", "10am", SAT), "2026-10-03T10:00");
  assert.equal(bumpSameWeekday("2026-10-10T10:00", "Saturday", SAT), "2026-10-10T10:00");
  assert.equal(bumpSameWeekday(null, "Saturday", SAT), null);
});

const UA = {
  igIos: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0.0 (iPhone15,2; iOS 17_5; en_US; en; scale=3.00; 1179x2556; 600000000)",
  igAndroid: "Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 Instagram 330.0.0.0.0 Android",
  fbIos: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.0;FBBV/1;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBCR/;FBID/phone;FBLC/en_US;FBOP/5]",
  fbAndroid: "Mozilla/5.0 (Linux; Android 14; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]",
  iosChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.0.0 Mobile/15E148 Safari/604.1",
  iosSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  firefoxDesktop: "Mozilla/5.0 (X11; Linux x86_64; rv:155.0) Gecko/20100101 Firefox/155.0",
  firefoxAndroid: "Mozilla/5.0 (Android 14; Mobile; rv:155.0) Gecko/155.0 Firefox/155.0",
  desktopChrome: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
};

test("in-app browser detection", () => {
  for (const k of ["igIos", "igAndroid", "fbIos", "fbAndroid"]) assert.equal(isInAppBrowser(UA[k]), true, k);
  for (const k of ["iosChrome", "iosSafari", "androidChrome", "desktopChrome", "firefoxDesktop", "firefoxAndroid"]) assert.equal(isInAppBrowser(UA[k]), false, k);
  assert.equal(isIosChrome(UA.iosChrome), true);
  assert.equal(isIosChrome(UA.androidChrome), false);
  assert.equal(isIosChrome(UA.iosSafari), false);
});

const ALL_KINDS = [null, "no-sr", "empty", "start-failed", "no-speech", "audio-capture", "network", "not-allowed", "service-not-allowed", "language-not-supported", "bad-grammar"];

test("in-app browsers: open-in-browser text with the platform hint, for every failure", () => {
  for (const kind of ALL_KINDS) {
    for (const k of ["igIos", "fbIos"]) assert.equal(voiceMessage(kind, UA[k]), E.IN_APP_IOS_MSG, `${kind} ${k}`);
    for (const k of ["igAndroid", "fbAndroid"]) assert.equal(voiceMessage(kind, UA[k]), E.IN_APP_ANDROID_MSG, `${kind} ${k}`);
  }
  assert.equal(E.IN_APP_IOS_MSG, "Open in your browser to use voice (tap ••• → Open in browser), or type the job below.");
  assert.equal(E.IN_APP_ANDROID_MSG, "Open in your browser to use voice (tap ⋮ → Open in Chrome), or type the job below.");
});

test("real browsers never get the open-in-browser text", () => {
  for (const kind of ALL_KINDS) for (const k of ["iosChrome", "iosSafari", "androidChrome", "desktopChrome", "firefoxDesktop", "firefoxAndroid"]) {
    const m = voiceMessage(kind, UA[k]);
    assert.doesNotMatch(m, /Open in your browser/, `${kind} ${k}`);
    assert.match(m, /type (the job|it) below/, `${kind} ${k} mentions typing`);
  }
});

test("real browsers: specific message per error", () => {
  for (const k of ["androidChrome", "desktopChrome", "iosSafari", "iosChrome"]) {
    assert.equal(voiceMessage("no-speech", UA[k]), "Didn't catch that, try again or type it below.", k);
    assert.equal(voiceMessage("empty", UA[k]), E.NO_SPEECH_MSG, k);
    assert.equal(voiceMessage("audio-capture", UA[k]), E.NO_MIC_MSG, k);
    assert.equal(voiceMessage("network", UA[k]), E.NETWORK_MSG, k);
    assert.equal(voiceMessage("not-allowed", UA[k]), "Microphone access is blocked. Allow microphone access for this site in your browser settings, then tap Voice Entry again. You can also type the job below.", k);
    assert.equal(voiceMessage("start-failed", UA[k]), E.START_FAILED_MSG, k);
    assert.equal(voiceMessage("language-not-supported", UA[k]), E.STOPPED_MSG, k);
  }
  assert.equal(voiceMessage("service-not-allowed", UA.iosChrome), "Voice doesn't work in Chrome on iPhone. Open this page in Safari to use voice, or type the job below.");
  for (const k of ["androidChrome", "desktopChrome", "iosSafari"]) assert.equal(voiceMessage("service-not-allowed", UA[k]), E.SERVICE_BLOCKED_MSG, k);
});

test("no SpeechRecognition: Firefox gets its own text, others a generic one", () => {
  assert.equal(voiceMessage("no-sr", UA.firefoxDesktop), "Voice entry isn't supported in Firefox yet. Open in Chrome or Safari, or type the job below.");
  assert.equal(voiceMessage("no-sr", UA.firefoxAndroid), E.FIREFOX_MSG);
  for (const k of ["iosSafari", "androidChrome", "desktopChrome"]) assert.equal(voiceMessage("no-sr", UA[k]), E.NO_SR_MSG, k);
});
