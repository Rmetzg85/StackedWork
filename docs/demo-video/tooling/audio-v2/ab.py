import numpy as np, librosa, json, sys, os
from tts import synth
from speechmos import dnsmos
LINES = json.load(open('script.json'))
WIN = {'a': 6.0, 'c': 4.7, 'd': 3.0, 'd2': 1.8, 'e': 5.1, 'f': 3.7, 'g': 4.3, 'h': 3.0}
CANDS = [('en_US-joe-medium', None), ('en_US-john-medium', None), ('en_US-norman-medium', None), ('en_US-bryce-medium', None)] + \
        [('en_US-libritts_r-medium', s) for s in (168, 552, 660, 36, 528)]
ls, sil = float(sys.argv[1]) if len(sys.argv) > 1 else 1.12, 0.5
os.makedirs('ab', exist_ok=True); res = []
for name, spk in CANDS:
    tag = name.replace('en_US-', '').replace('-medium', '') + (f'-{spk}' if spk is not None else '')
    durs = {}; allx = []
    for k, t in LINES.items():
        a, sr = synth(name, t, f'ab/{tag}-{k}.wav', speaker=spk, ls=ls, sil=sil)
        durs[k] = round(len(a) / sr, 2); x = a.astype(np.float32) / 32768; allx += [x, np.zeros(int(sr * .3), np.float32)]
    x = np.concatenate(allx)
    f0, vf, _ = librosa.pyin(x, fmin=60, fmax=300, sr=sr, frame_length=1024)
    f0 = f0[vf & ~np.isnan(f0)]; st = 12 * np.log2(f0 / np.median(f0))
    m = dnsmos.run(np.clip(librosa.resample(x, orig_sr=sr, target_sr=16000), -.999, .999), 16000, return_df=False)
    over = {k: round(durs[k] - WIN[k], 2) for k in durs if durs[k] > WIN[k]}
    res.append(dict(voice=tag, sr=sr, f0_med=round(float(np.median(f0))), pitch_sd_st=round(float(st.std()), 2),
                    ovrl=round(float(m['ovrl_mos']), 2), sig=round(float(m['sig_mos']), 2), p808=round(float(m['p808_mos']), 2), over=over, durs=durs))
    print(res[-1], flush=True)
json.dump(res, open(f'ab-results-{ls}.json', 'w'), indent=1)
