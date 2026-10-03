import numpy as np, librosa
from tts import synth
from speechmos import dnsmos
T = "Water heater replacement for Mike Davis, at 42 Oak Street. Tuesday at 10 AM, eighteen hundred fifty dollars."
for spk in (552, 36, 564, 168, 528):
  for ls, ns, nw in ((1.0, 0.667, 0.8), (1.0, 0.75, 0.95), (1.05, 0.75, 0.95)):
    a, sr = synth('en_US-libritts_r-medium', T, f'ab/contractor-{spk}-{ls}-{ns}.wav', speaker=spk, ls=ls, sil=0.3, noise=ns, noise_w=nw)
    x = a.astype(np.float32) / 32768
    f0, vf, _ = librosa.pyin(x, fmin=60, fmax=300, sr=sr, frame_length=1024); f = f0[vf & ~np.isnan(f0)]
    m = dnsmos.run(np.clip(librosa.resample(x, orig_sr=sr, target_sr=16000), -.999, .999), 16000, return_df=False)
    print(spk, ls, ns, nw, 'dur', round(len(a)/sr, 2), 'F0', round(float(np.median(f))), 'sd_st', round(float((12*np.log2(f/np.median(f))).std()), 2), 'OVRL', round(float(m['ovrl_mos']), 2), 'P808', round(float(m['p808_mos']), 2), flush=True)
