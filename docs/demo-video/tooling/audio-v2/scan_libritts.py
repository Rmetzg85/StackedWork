import numpy as np, librosa, json
from tts import synth
from speechmos import dnsmos
T = "Tap New Job, then Voice Entry, and just say the job the way you'd say it."
rows = []
for spk in range(0, 904, 12):
    a, sr = synth('en_US-libritts_r-medium', T, speaker=spk)
    x = a.astype(np.float32) / 32768
    f0 = librosa.yin(x, fmin=60, fmax=400, sr=sr); f0m = float(np.median(f0))
    if f0m > 145: continue
    x16 = np.clip(librosa.resample(x, orig_sr=sr, target_sr=16000), -0.999, 0.999)
    m = dnsmos.run(x16, 16000, return_df=False)
    rows.append((spk, round(f0m), round(float(m['ovrl_mos']), 3), round(float(m['sig_mos']), 3), round(float(m['p808_mos']), 3)))
rows.sort(key=lambda r: -(r[2] + r[4]))
print('male-ish speakers (spk, F0, OVRL, SIG, P808):'); [print(r) for r in rows[:12]]
json.dump(rows, open('libritts_males.json', 'w'))
