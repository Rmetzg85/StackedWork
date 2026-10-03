import subprocess, json, re, sys
TOTAL = 41.8
PLACE = [('vo/a.wav', 0.40), ('vo/contractor.wav', 6.739), ('vo/c.wav', 13.60), ('vo/d.wav', 18.60), ('vo/d2.wav', 21.80),
         ('vo/e.wav', 23.90), ('vo/f.wav', 29.40), ('vo/g.wav', 33.50), ('vo/h.wav', 37.85)]
MUSIC_LUFS = float(sys.argv[1]) if len(sys.argv) > 1 else -25.0
def run(args): return subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *args], capture_output=True, text=True, timeout=300)
def lufs(path, extra=''):
    r = run(['-i', path, '-af', f'{extra}ebur128=peak=true', '-f', 'null', '-'])
    s = r.stderr[r.stderr.rfind('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))
# 1) voice bus at 44.1k stereo, levelled to -16 LUFS
ins = []; fc = ''
for j, (f, at) in enumerate(PLACE):
    ins += ['-i', f]; ms = int(at * 1000); fc += f'[{j}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[s{j}];'
fc += ''.join(f'[s{j}]' for j in range(len(PLACE))) + f'amix=inputs={len(PLACE)}:normalize=0,apad,atrim=0:{TOTAL}[v]'
r = run([*ins, '-filter_complex', fc, '-map', '[v]', '-c:a', 'pcm_s16le', 'voice_raw.wav']); assert r.returncode == 0, r.stderr[-800:]
vi, _ = lufs('voice_raw.wav'); run(['-i', 'voice_raw.wav', '-af', f'volume={-16 - vi:.2f}dB', '-c:a', 'pcm_f32le', 'voice.wav'])
# 2) music bed: whole length, soft 2.5 s fade-in, 2.5 s fade-out, levelled to MUSIC_LUFS (pre-duck)
run(['-i', '../music.wav', '-af', f'atrim=0:{TOTAL},asetpts=N/SR/TB,aresample=44100,afade=t=in:st=0:d=2.5,afade=t=out:st={TOTAL-2.5:.2f}:d=2.5', '-c:a', 'pcm_f32le', 'music_raw.wav'])
mi, _ = lufs('music_raw.wav'); run(['-i', 'music_raw.wav', '-af', f'volume={MUSIC_LUFS - mi:.2f}dB', '-c:a', 'pcm_f32le', 'music.wav'])
# 3) sidechain duck (gentle: 150 ms attack, 900 ms release, ~5 dB under speech)
SC = sys.argv[2] if len(sys.argv) > 2 else 'sidechaincompress=threshold=0.05:ratio=2:knee=4:attack=150:release=900:makeup=1'
r = run(['-i', 'music.wav', '-i', 'voice.wav', '-filter_complex', f'[0:a]apad=pad_dur=3[m];[1:a]apad=pad_dur=3[k];[m][k]{SC},atrim=0:{TOTAL}[d]', '-map', '[d]', '-c:a', 'pcm_f32le', 'music_ducked.wav']); assert r.returncode == 0, r.stderr[-800:]
# 4) mix + two-pass loudnorm to -16 LUFS / -1.5 dBTP
r = run(['-i', 'voice.wav', '-i', 'music_ducked.wav', '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-2.0:LRA=11:print_format=json', '-f', 'null', '-'])
m = json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1])
ln = f"loudnorm=I=-16:TP=-2.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
r = run(['-i', 'voice.wav', '-i', 'music_ducked.wav', '-filter_complex', f'[0:a][1:a]amix=inputs=2:normalize=0,{ln},aresample=44100[a]', '-map', '[a]', '-c:a', 'pcm_s16le', 'mix.wav']); assert r.returncode == 0, r.stderr[-800:]
# 5) mux onto the unchanged video stream from the committed demo-full.mp4
r = run(['-i', 'base-demo-full.mp4', '-i', 'mix.wav', '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', '-t', f'{TOTAL}', '-movflags', '+faststart', 'demo-full-v2.mp4'])
assert r.returncode == 0, r.stderr[-800:]
# report
import numpy as np, soundfile as sf
mu, sr = sf.read('music.wav'); md, _ = sf.read('music_ducked.wav'); vo, _ = sf.read('voice.wav')
env = np.abs(vo).max(axis=1); win = int(sr * .05); speech = np.convolve(env > 0.01, np.ones(win), 'same') > 0
def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
red_speech = db(mu[speech]) - db(md[speech]); red_gap = db(mu[~speech & (np.arange(len(mu)) > sr * 3)]) - db(md[~speech & (np.arange(len(mu)) > sr * 3)])
out = dict(voice_bus_lufs=lufs('voice.wav')[0], music_pre_duck_lufs=lufs('music.wav')[0], music_ducked_lufs=lufs('music_ducked.wav')[0],
           duck_db_during_speech=round(red_speech, 1), duck_db_in_gaps=round(red_gap, 1), mix_wav=lufs('mix.wav'), final_mp4=lufs('demo-full-v2.mp4'))
print(json.dumps(out)); json.dump(out, open('loudness.json', 'w'), indent=1)
