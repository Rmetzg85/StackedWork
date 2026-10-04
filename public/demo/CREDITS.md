# Homepage demo video: sources and licenses

All footage is a **real screen recording of the production app** (https://www.letstaystacked.com), made while signed
in as the internal QA smoke account. Nothing was mocked or staged in the app. Each segment is only cut, sped up
(never slowed) or held on a frame, and captions are burned in. Every customer, phone number (555-01xx), email
(@example.com) and address in the footage is fictional. Everything created for a recording (jobs, estimate, invoice,
receipt, photos, lead) was deleted right afterwards with the account's own permissions.

| File | What it is |
|---|---|
| `hero-loop.mp4` | H.264, 600×1206, 25.7 s, no audio track, faststart. Muted homepage loop (recorded 2026-10-03, 4:33 PM ET). |
| `hero-loop.webm` | VP9 version of the same loop (fallback). |
| `hero-poster.webp` | One frame from the loop (job filled in from speech). |
| `demo-full.mp4` | H.264 + AAC 96 kb/s, 720×1448, 45.0 s, 1.66 MB, faststart. Tap-to-play version with voiceover and music (v4, recorded 2026-10-03, 8:55 PM ET). |
| `demo-full.en.vtt` | Captions for the voiceover in `demo-full.mp4`, in the voiceover's exact words. |

## Voiceover
- Voiceover: Charlie's ElevenLabs recording (commercial rights per Charlie's ElevenLabs plan)
- Edited by one cut only (the homeowner section, 13.65 s), with a 40 ms crossfade on zero-crossings inside pauses.
  Everything else is as recorded. Level-matched to -16 LUFS by gain only, with no other processing.

## Music
- "Newer Wave" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 https://creativecommons.org/licenses/by/4.0/
- Ducked under the voiceover with ffmpeg `sidechaincompress` (about 4.6 dB under speech). 1 s fade-in, 2.5 s fade-out, ending on a bar line.
  Level -23 LUFS before ducking.

## Mix
- Voice bus at -16 LUFS. Final mix uses two-pass `loudnorm` (target -16 LUFS, -2 dBTP ceiling to leave headroom for AAC).
- Measured on the final MP4: **-15.9 LUFS integrated, -2.1 dBTP true peak**.

## Images shown in the app
- The before/after bathroom photos uploaded on the Photos tab: NPS / Jacob W. Frank, Yellowstone National Park,
  public domain (US federal government work). "Seasonal employee housing bathroom before/after renovation",
  Wikimedia Commons (Flickr 50014558717 / 50014557962).
- The receipt image uploaded on the Receipts tab is a fictional sample generated for the recording.

## How the voice-entry step was recorded
- Browser: Google Chrome (headless), driven by Playwright at a 390×844 phone viewport. Frames were captured at 2× via the Chrome DevTools Protocol.
- A synthesized sentence was played into a virtual microphone. It is **not** in the soundtrack.
- The app's **own Web Speech voice entry** heard it ("Heard: Water Heater replacement for Mike Davis at 42 Oak Street Tuesday at 10:00 a.m. 1850").
- The app's own parser filled in the form: customer, address, Plumbing, Tue 10:00 AM, $1,850, Scheduled.
- The invoice (INV-0002, due Oct 18, 2026, Net 15) was created in the app from an accepted estimate with **Create Invoice**,
  then shared with Copy Link. The public invoice page shown is that link.

## Fonts
- Captions and the end card use **DM Sans** (SIL Open Font License 1.1), the same font as the site.

Tooling and the run report: `docs/demo-video/tooling/v4/`.
