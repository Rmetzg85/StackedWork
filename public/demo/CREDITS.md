# Homepage demo video: sources and licenses

All footage is a **real screen recording of the production app** (https://www.letstaystacked.com), made on
2026-10-03 at 4:33 PM ET while signed in as the internal QA smoke account. Nothing was mocked or staged in the
app. Each segment is only sped up or held on a frame, and captions are burned in.
The customer "Mike Davis, 42 Oak Street, (410) 555-0142" is fictional. The job and the estimate made for the
recording were deleted right afterwards through the app's own Delete buttons.

| File | What it is |
|---|---|
| `hero-loop.mp4` | H.264, 600×1206, 25.7 s, no audio track, faststart. Muted homepage loop. |
| `hero-loop.webm` | VP9 version of the same loop (fallback). |
| `hero-poster.webp` | One frame from the loop (job filled in from speech). |
| `demo-full.mp4` | H.264 + AAC, 720×1448, 41.8 s, faststart. Tap-to-play version with voiceover and music. |
| `demo-full.en.vtt` | Captions for the voiceover in `demo-full.mp4`. |

## How the voice step was recorded
- Browser: Google Chrome (headless), driven by Playwright at a 390×844 phone viewport. Frames were captured at 2× via the Chrome DevTools Protocol.
- The spoken sentence was generated with Piper TTS and played into a virtual PulseAudio microphone.
- The app's **own Web Speech voice entry** heard it ("Heard: Water Heater replacement for Mike Davis at 42 Oak Street Tuesday at 10:00 a.m. 1850").
- The app's own `/api/parse-job` filled in the form: customer, address, Plumbing, Tue Oct 6 10:00 AM, $1,850, Scheduled.
- The estimate line item was typed into the app's estimate form. The app does not create estimates from a job automatically, and the video doesn't claim it does.

## Voice (TTS)
- Engine: [Piper](https://github.com/OHF-Voice/piper1-gpl) (`piper-tts` 1.8.0, GPL-3.0). The software license doesn't apply to the audio it generates.
- Voice model: `en_US-libritts_r-medium` (rhasspy/piper-voices), speakers 0 (narrator) and 20 (contractor).
- The model was trained on **LibriTTS-R, CC BY 4.0** (http://www.openslr.org/141/). LibriTTS-R is derived from LibriVox public-domain recordings.
- Attribution: LibriTTS-R by Koizumi et al., licensed CC BY 4.0.

## Music
- An original synthesized pad (4-chord sine progression: Cmaj7, Am7, Fmaj7, G6, with soft echo), generated with ffmpeg `aevalsrc` for this video.
- No samples or third-party recordings were used. Dedicated to the public domain under **CC0 1.0**.
- Mixed low and ducked under the voice.

## Fonts
- Captions and the end card use **DM Sans** (SIL Open Font License 1.1), the same font as the site.
