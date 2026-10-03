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
| `demo-full.mp4` | H.264 + AAC 96 kb/s, 720×1448, 41.8 s, 1.29 MB, faststart. Tap-to-play version with voiceover and music (audio v3, 2026-10-03). |
| `demo-full.en.vtt` | Captions for the voiceover in `demo-full.mp4`. |

## How the voice step was recorded
- Browser: Google Chrome (headless), driven by Playwright at a 390×844 phone viewport. Frames were captured at 2× via the Chrome DevTools Protocol.
- The spoken sentence was generated with Piper TTS and played into a virtual PulseAudio microphone.
- The app's **own Web Speech voice entry** heard it ("Heard: Water Heater replacement for Mike Davis at 42 Oak Street Tuesday at 10:00 a.m. 1850").
- The app's own `/api/parse-job` filled in the form: customer, address, Plumbing, Tue Oct 6 10:00 AM, $1,850, Scheduled.
- The estimate line item was typed into the app's estimate form. The app does not create estimates from a job automatically, and the video doesn't claim it does.

## Voice (TTS), audio v3
- Engine: [Piper](https://github.com/OHF-Voice/piper1-gpl) (`piper-tts` 1.8.0, GPL-3.0). The software license doesn't apply to the audio it generates.
- **Narrator:** `en_US-libritts_r-medium` (rhasspy/piper-voices), **speaker 660** (LibriTTS-R reader 639), a male voice
  (median pitch about 111 Hz). Settings: `length_scale` 1.15, 0.5 s of silence between sentences, default noise.
- **Contractor line** ("Water heater replacement for Mike Davis, at 42 Oak Street. Tuesday at 10 AM, eighteen hundred fifty dollars."):
  re-voiced in v3 with the same model, **speaker 552** (LibriTTS-R reader 398), a deeper male voice (median pitch about 93 Hz,
  about 3 semitones below the narrator). Delivery is a bit quicker and looser than the narrator's (`length_scale` 1.0,
  noise 0.75 / noise_w 0.95), and the line runs 6.07 s inside the original window (6.74 to 12.81 s).
  - It uses the same words the app transcribed on screen. The live recording itself fed the app a different TTS take
    (speaker 20). That take has been removed from this soundtrack completely.
- Training data: **LibriTTS-R, CC BY 4.0** (http://www.openslr.org/141/), derived from LibriVox public-domain recordings.
  Attribution: LibriTTS-R by Koizumi et al., licensed CC BY 4.0.
- How the voice was picked: we A/B tested the same script on male Piper voices, with an automatic speech-quality score
  (DNSMOS), pitch variation (flatter pitch sounds more robotic) and fit to the caption windows. Tooling and results are in
  `docs/demo-video/tooling/audio-v2/`.
  - `libritts_r` speaker 660 had the top overall score (DNSMOS OVRL 3.40, P.808 4.10) with lively pitch (3.4 semitones SD), and every line fit its window at a relaxed pace.
  - `joe-medium` (CC0) scored P.808 4.08 but had the flattest pitch (2.8 st), and four lines ran past their windows.
  - `norman-medium` and `john-medium` (public domain, LibriVox) and `bryce-medium` (public domain) were slower. Most lines overran, so the script would have had to be cut down.
  - Not used for licensing reasons: `ryan-high` is **CC BY-NC-SA 4.0** (non-commercial only, which rules out marketing use). `lessac-high` is under the Blizzard 2013 Lessac license (research use) and is a female voice.

## Music
- An original synthesized pad (4-chord sine progression: Cmaj7, Am7, Fmaj7, G6, with soft echo), generated with ffmpeg `aevalsrc` for this video.
- No samples or third-party recordings were used. Dedicated to the public domain under **CC0 1.0**.
- Plays under the whole video, with a 2.5 s fade-in and a 2.5 s fade-out. Its level is -25 LUFS before ducking and -27.9 LUFS after.
- Ducked under speech with ffmpeg `sidechaincompress` (threshold 0.05, ratio 2, knee 4, attack 150 ms, release 900 ms). That gives about 5.1 dB of reduction during speech (narrator and contractor lines) and about 0.8 dB in the gaps.

## Mix
- The voice bus is levelled to -16 LUFS. The final mix uses two-pass `loudnorm` (target -16 LUFS, -2 dBTP, which leaves headroom for AAC).
- Measured on the final MP4: **-16.3 LUFS integrated, -1.8 dBTP true peak**.
- The video stream is bit-identical to the previous version (same footage, captions and timing). Only the audio track was replaced.

## Fonts
- Captions and the end card use **DM Sans** (SIL Open Font License 1.1), the same font as the site.
