import wave, io, numpy as np, json, sys
from piper import PiperVoice, SynthesisConfig
_cache = {}
def voice(name):
    if name not in _cache: _cache[name] = PiperVoice.load(f'/workspace/demo-rec/voices/{name}.onnx')
    return _cache[name]
def synth(name, text, path=None, speaker=None, ls=1.12, sil=0.5, noise=None, noise_w=None):
    v = voice(name); cfg = SynthesisConfig(speaker_id=speaker, length_scale=ls, noise_scale=noise, noise_w_scale=noise_w)
    sr = v.config.sample_rate; parts = []
    chunks = list(v.synthesize(text, syn_config=cfg))
    for i, c in enumerate(chunks):
        parts.append(c.audio_int16_array.astype(np.int16))
        if i < len(chunks) - 1: parts.append(np.zeros(int(sr * sil), np.int16))
    a = np.concatenate(parts)
    if path:
        with wave.open(path, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(a.tobytes())
    return a, sr
