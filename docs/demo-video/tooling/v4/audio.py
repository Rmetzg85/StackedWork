"""Voice memo cleanup, transcription, take matching, trimming, music bed and final mix."""
import json, os, re, subprocess, difflib
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000

def ff(args, **kw):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *args], capture_output=True, text=True, timeout=kw.get('timeout', 600))
    if r.returncode: raise RuntimeError(r.stderr[-1500:])
    return r

def lufs(path, af=''):
    r = ff(['-i', path, '-af', f'{af}ebur128=peak=true', '-f', 'null', '-'])
    s = r.stderr[r.stderr.rfind('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))

# ---------------------------------------------------------------- cleanup
def sibilance_ratio(path):
    x, sr = sf.read(path); x = x if x.ndim == 1 else x.mean(1)
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / sr)
    return float(X[(f > 5000) & (f < 10000)].sum() / max(X[(f > 100) & (f < 10000)].sum(), 1e-12))

def clean(memo, out, denoise='rnn'):
    """Decode any phone format -> 48 kHz mono, high-pass 80 Hz, denoise (RNNoise model, plus light FFT denoise),
    trim mud, presence lift, de-ess only if the take is sibilant, gentle compression, -16 LUFS (2-pass loudnorm)."""
    raw = out.replace('.wav', '.raw.wav')
    ff(['-i', memo, '-vn', '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_f32le', raw])
    dn = f"arnndn=m='{HERE}/models/cb.rnnn':mix=0.85," if denoise == 'rnn' else ''
    chain = (f"highpass=f=80:poles=2,{dn}afftdn=nr=8:nf=-45:tn=1,"
             "equalizer=f=250:t=q:w=1.0:g=-2,equalizer=f=3800:t=q:w=1.2:g=2.5,equalizer=f=10000:t=h:w=0.7:g=1")
    pre = out.replace('.wav', '.eq.wav'); ff(['-i', raw, '-af', chain, '-c:a', 'pcm_f32le', pre])
    sib = sibilance_ratio(pre); deess = sib > 0.08
    chain2 = ("deesser=i=0.4:m=0.5:f=0.5," if deess else "") + "acompressor=threshold=-22dB:ratio=2.5:attack=12:release=180:knee=4:makeup=1.5"
    comp = out.replace('.wav', '.comp.wav'); ff(['-i', pre, '-af', chain2, '-c:a', 'pcm_f32le', comp])
    r = ff(['-i', comp, '-af', 'loudnorm=I=-16:TP=-2:LRA=9:print_format=json', '-f', 'null', '-'])
    m = json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1])
    ff(['-i', comp, '-af', f"loudnorm=I=-16:TP=-2:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,aresample={SR}",
        '-c:a', 'pcm_f32le', out])
    for p in (raw, pre, comp): os.remove(p)
    return {'deess': deess, 'sibilance_ratio': round(sib, 3), 'input_lufs': float(m['input_i']), 'cleaned_lufs': lufs(out)[0]}

# ---------------------------------------------------------------- transcription + take matching
_model = None
def transcribe(path, model='small.en'):
    global _model
    from faster_whisper import WhisperModel
    if _model is None: _model = WhisperModel(model, device='cpu', compute_type='int8', download_root=f'{HERE}/models/whisper')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    segs, _ = _model.transcribe(np.frombuffer(raw, np.float32), language='en', word_timestamps=True, vad_filter=False, beam_size=5,
                                initial_prompt='StackedWork. letstaystacked.com.')
    words = [{'w': w.word.strip(), 's': float(w.start), 'e': float(w.end), 'p': float(w.probability)} for s in segs for w in s.words]
    return words

def norm(s, years=False):
    from num2words import num2words
    s = s.lower().replace('$', ' ').replace('&', ' and ')
    s = re.sub(r'(\d),(\d)', r'\1\2', s)
    s = re.sub(r'\d+', lambda m: ' ' + num2words(int(m.group()), to='year' if years and 1100 <= int(m.group()) <= 9999 else 'cardinal') + ' ', s)
    s = s.replace('.com', ' dot com').replace(' and ', ' ')
    return re.sub(r'[^a-z]', '', s)

def utterances(path, thresh_db=None, min_sil=0.6, min_len=0.25):
    """Energy-based speech regions in the cleaned memo (more reliable cut points than ASR word timestamps)."""
    x, sr = sf.read(path); x = x if x.ndim == 1 else x.mean(1)
    hop = int(sr * 0.01); n = len(x) // hop
    e = 20 * np.log10(np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, 1)) + 1e-9)
    if thresh_db is None:  # adaptive: halfway between the noise floor and typical speech level
        floor, speech = np.percentile(e, 10), np.percentile(e, 90); thresh_db = max(floor + 10, (floor + speech) / 2 - 6)
    on = e > thresh_db; regs = []; i = 0
    while i < n:
        if on[i]:
            j = i
            while j < n and (on[j] or (j + int(min_sil * 100) < n and on[j:j + int(min_sil * 100)].any())): j += 1
            if (j - i) / 100 >= min_len: regs.append((i / 100, j / 100))
            i = j
        else: i += 1
    return regs

def chunks_from_words(words, gap=0.7, regions=None):
    """Group words into utterances. With `regions` (energy-based), words are assigned by their midpoint and each chunk
    carries the region's real start/end; otherwise fall back to ASR timestamps split on gaps."""
    if regions:
        out = []
        for a, b in regions:
            ws = [dict(w) for w in words if a - 0.15 <= (w['s'] + w['e']) / 2 <= b + 0.15]
            if ws: ws[0]['s'] = a; ws[-1]['e'] = b; out.append(ws)
        return out
    out = []
    for w in words:
        if out and w['s'] - out[-1][-1]['e'] < gap: out[-1].append(w)
        else: out.append([w])
    return out

def score(text, script):
    return max(difflib.SequenceMatcher(None, norm(text, y1), norm(script, y2)).ratio() for y1 in (False, True) for y2 in (False, True))

def match_lines(words, lines, keep='last', min_score=0.6, regions=None):
    """lines: [(id, role, anchor, script)]. Greedy in order; windows of 1-3 consecutive chunks; repeated takes of the
    same line are detected and (by default) the LAST good take is kept, since the instruction is 'repeat if flubbed'."""
    ch = chunks_from_words(words, regions=regions); res = []; p = 0; leftovers = []
    txt = lambda a, b: ' '.join(w['w'] for c in ch[a:b] for w in c)
    for li, (lid, role, _, script) in enumerate(lines):
        nxt = lines[li + 1][3] if li + 1 < len(lines) else None
        takes = []; j = p
        while j < len(ch):
            best = max(((score(txt(j, j + n), script), n) for n in (1, 2, 3) if j + n <= len(ch)), default=(0, 1))
            nxt_s = score(txt(j, j + 1), nxt) if nxt else 0
            if best[0] >= min_score and best[0] >= nxt_s:
                takes.append({'chunks': (j, j + best[1]), 'score': round(best[0], 3), 'text': txt(j, j + best[1])}); j += best[1]
            elif takes or (nxt and nxt_s >= min_score):
                break  # moved on to the next line
            else:
                j += 1
        if not takes:
            res.append({'id': lid, 'role': role, 'missing': True, 'script': script}); continue
        p = takes[-1]['chunks'][1]
        chosen = takes[-1] if keep == 'last' else max(takes, key=lambda t: t['score'])
        if keep == 'last' and chosen['score'] < max(t['score'] for t in takes) - 0.15: chosen = max(takes, key=lambda t: t['score'])
        a, b = chosen['chunks']; ws = [w for c in ch[a:b] for w in c]
        sw, tw = script.lower().split(), chosen['text'].lower().split()
        diff = [d for d in difflib.ndiff([re.sub(r'[^a-z0-9$]', '', x) for x in sw], [re.sub(r'[^a-z0-9$]', '', x) for x in tw]) if d[0] in '+-']
        res.append({'id': lid, 'role': role, 'script': script, 'text': chosen['text'], 'score': chosen['score'], 'start': ws[0]['s'], 'end': ws[-1]['e'],
                    'n_takes': len(takes), 'takes': takes, 'low_conf_words': [w['w'] for w in ws if w['p'] < 0.5], 'word_diff': diff[:12]})
    used = set()
    for r in res:
        for t in r.get('takes', []): used.update(range(*t['chunks']))
    leftovers = [{'text': ' '.join(w['w'] for w in c), 't': round(c[0]['s'], 2)} for i, c in enumerate(ch) if i not in used]
    return res, leftovers

def cut_line(src, start, end, out, pre=0.12, post=0.25, thresh_db=-42):
    """Cut [start-pre, end+post] then trim residual silence by energy (keeps 60 ms either side) with 15 ms fades."""
    x, sr = sf.read(src); a = max(0, int((start - pre) * sr)); b = min(len(x), int((end + post) * sr)); y = x[a:b]
    win = int(sr * 0.02); e = np.sqrt(np.convolve(y ** 2, np.ones(win) / win, 'same')) + 1e-9
    on = np.where(20 * np.log10(e) > thresh_db)[0]
    if len(on): y = y[max(0, on[0] - int(sr * .06)):min(len(y), on[-1] + int(sr * .06))]
    f = int(sr * 0.015); ramp = np.linspace(0, 1, f); y[:f] *= ramp; y[-f:] *= ramp[::-1]
    sf.write(out, y.astype(np.float32), sr, subtype='FLOAT'); return len(y) / sr

# ---------------------------------------------------------------- music + mix
MUSIC = {'file': '/workspace/demo-rec/v4/Newer_Wave.mp3', 'bar': 4 * 60 / 112.35, 'start_bar_t': 19.691}  # phrase start (bar 7)

def music_bed(total, out, lufs_target):
    """Ends exactly on a bar line of the track (phrase start 19.69 s + N bars), so the 2.5 s fade-out lands on a
    musical boundary; the bed starts at video 0 (partway into the preceding bar) with a 1 s fade-in."""
    bar = MUSIC['bar']; nbars = int(np.ceil(total / bar)); track_end = MUSIC['start_bar_t'] + nbars * bar
    while track_end - total < 0: nbars += 1; track_end = MUSIC['start_bar_t'] + nbars * bar
    track_in = track_end - total
    tmp = out.replace('.wav', '.raw.wav')
    ff(['-ss', f'{track_in:.3f}', '-t', f'{total:.3f}', '-i', MUSIC['file'], '-af',
        f"aresample={SR},afade=t=in:st=0:d=1.0,afade=t=out:st={total-2.5:.3f}:d=2.5,apad,atrim=0:{total:.3f}", '-ac', '2', '-c:a', 'pcm_f32le', tmp])
    i, _ = lufs(tmp); ff(['-i', tmp, '-af', f'volume={lufs_target - i:.2f}dB', '-c:a', 'pcm_f32le', out]); os.remove(tmp)
    return {'track_in_s': round(track_in, 3), 'track_out_s': round(track_end, 3), 'ends_on_bar': f'phrase start + {nbars} bars', 'bpm': 112.35}

SC = 'sidechaincompress=threshold=0.05:ratio=2:knee=4:attack=120:release=700:makeup=1'

def mix(placements, total, music_wav, work, out_wav, sc=SC):
    """placements: [(wav, start_s)]. Voice bus -> -16 LUFS; music ducked by the voice bus; 2-pass loudnorm -16 / -2 dBTP."""
    ins, fc = [], ''
    for j, (f, at) in enumerate(placements):
        ins += ['-i', f]; ms = int(round(at * 1000)); fc += f'[{j}:a]aresample={SR},pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[s{j}];'
    fc += ''.join(f'[s{j}]' for j in range(len(placements))) + f'amix=inputs={len(placements)}:normalize=0,apad,atrim=0:{total:.3f}[v]'
    ff([*ins, '-filter_complex', fc, '-map', '[v]', '-c:a', 'pcm_f32le', f'{work}/voice_raw.wav'])
    vi, _ = lufs(f'{work}/voice_raw.wav'); ff(['-i', f'{work}/voice_raw.wav', '-af', f'volume={-16 - vi:.2f}dB', '-c:a', 'pcm_f32le', f'{work}/voice.wav'])
    ff(['-i', music_wav, '-i', f'{work}/voice.wav', '-filter_complex', f'[0:a]apad=pad_dur=3[m];[1:a]apad=pad_dur=3[k];[m][k]{sc},atrim=0:{total:.3f}[d]',
        '-map', '[d]', '-c:a', 'pcm_f32le', f'{work}/music_ducked.wav'])
    base = ['-i', f'{work}/voice.wav', '-i', f'{work}/music_ducked.wav']
    r = ff([*base, '-filter_complex', '[0:a][1:a]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-2.0:LRA=11:print_format=json', '-f', 'null', '-'])
    m = json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1])
    ln = f"loudnorm=I=-16:TP=-2.0:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    ff([*base, '-filter_complex', f'[0:a][1:a]amix=inputs=2:normalize=0,{ln},aresample=44100[a]', '-map', '[a]', '-c:a', 'pcm_s16le', out_wav])
    # music level report: short-term loudness of the (ducked) music in speech vs gaps, plus the duck depth
    mu, sr = sf.read(music_wav); md, _ = sf.read(f'{work}/music_ducked.wav'); vo, _ = sf.read(f'{work}/voice.wav')
    n = min(len(mu), len(md), len(vo)); mu, md, vo = mu[:n], md[:n], vo[:n]
    env = np.abs(vo).max(1); speech = np.convolve(env > 0.01, np.ones(int(sr * .05)), 'same') > 0
    body = (np.arange(n) > sr * 1.5) & (np.arange(n) < n - sr * 2.5)
    db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    return {'voice_lufs': lufs(f'{work}/voice.wav')[0], 'music_pre_duck_lufs': lufs(music_wav)[0], 'music_ducked_lufs': lufs(f'{work}/music_ducked.wav')[0],
            'duck_db_under_speech': round(db(mu[speech & body]) - db(md[speech & body]), 1), 'duck_db_in_gaps': round(db(mu[~speech & body]) - db(md[~speech & body]), 1),
            'music_rms_db_in_gaps': round(db(md[~speech & body]), 1), 'music_rms_db_under_speech': round(db(md[speech & body]), 1),
            'voice_rms_db_in_speech': round(db(vo[speech & body]), 1)}
