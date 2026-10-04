# v4 VO prep (used by demo-full.mp4 v4)
- Source: /workspace/stackedwork/hero-video/charlie-vo/charlie-elevenlabs.mp3. The original is untouched (sha256 checked); work is on a copy.
- One cut: 35.170 s -> 48.820 s (13.65 s removed). Both edges are mid-pause and on zero-crossings, with a 40 ms equal-power crossfade.
  Removed: "And for homeowners, finding a trusted contractor just got simple. Real pros. Real work. No guessing.
  Whether you're swinging a hammer or hiring someone who does, StackedWork keeps everyone on the same page."
- Kept: "Invoicing", "serious about getting paid", "you're the first to know", and the domain line as recorded.
- Level: -14.5 -> -16.0 LUFS by gain only (peak -1.9 dBFS). No other processing. File: vo_edit.wav, 42.88 s.
- Whisper re-check of the edit: none of the removed words are left. The words either side of the cut ("place." / "Stay") come back at 0.96-1.0 confidence, so nothing is clipped.
- Edited transcript (captions will spell StackedWork / letstaystacked.com): see edit_words.json
