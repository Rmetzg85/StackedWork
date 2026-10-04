"""demo-full v4: real prod footage (rec/take) cut to Charlie's ElevenLabs VO (vo/vo_edit.wav), captions in his words,
Newer Wave music bed ducked under the VO. Usage: python3 build_v4.py"""
import json, os, subprocess, sys
sys.path.insert(0, '/workspace/demo-rec/v4/pipeline')
import audio
REC = '/workspace/demo-rec'; HERE = '/workspace/demo-rec/v4'; TAKE = f'{HERE}/rec/take'; OUT = f'{HERE}/out'; WORK = f'{OUT}/work'
os.makedirs(WORK, exist_ok=True); FPS = 30
ev = json.load(open(f'{TAKE}/events.json')); t0 = ev[0]['t']; E = {e['name']: e['t'] - t0 for e in ev}
fr = [(f['t'] - t0, f['i']) for f in json.load(open(f'{TAKE}/frames.json'))]
def frame_at(s):
    lo, hi = 0, len(fr) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if fr[mid][0] <= s: lo = mid
        else: hi = mid - 1
    return f'{TAKE}/frames/{fr[lo][1]:05d}.jpg'
VO = f'{HERE}/vo/vo_edit.wav'; VO_LEN = 42.88; TOTAL = 45.0
# Beats: (label, out_start, out_end, src_start, src_end, words). Speed = src/out, capped at 1.0 minimum (no slow motion: hold the last frame instead).
BEATS = [
    ('Jobs board, tap + New Job',              0.00,  5.10, E['jobs'] - 0.6, E['voice_start'] + 0.5, 'Work hard ... It\'s on you.'),
    ('Voice entry: heard, then filled in',     5.10, 15.00, E['voice_start'] + 0.5, E['parsed'] + 2.6, 'But what if ... staying organized.'),
    ('Confirm & save, job in the list',       15.00, 16.75, E['save_click'] - 0.1, E['job_saved'] + 0.6, 'Log jobs in seconds.'),
    ('Profit tab',                            16.75, 18.00, E['profit'] + 0.2, E['profit'] + 1.6, 'Track every dollar.'),
    ('Estimate detail (accepted)',            18.00, 20.45, E['est_detail'] + 0.1, E['est_detail_end'], 'Send professional estimates from your phone.'),
    ('Leads tab: new unread lead, bell badge', 20.45, 23.35, E['leads'] + 0.3, E['leads_end'], 'And when a lead comes in, you\'re the first to know.'),
    ('Receipts tab',                          23.35, 26.20, E['receipts'] + 0.2, E['receipts_end'], 'Already using five different apps just to keep up,'),
    ('Accepted estimate -> Create Invoice -> INV-0002 (due Oct 18, 2026)', 26.20, 30.65, E['est2'] + 0.3, E['copy_click'] - 0.05, 'StackedWork replaces all of them. Job tracking, invoicing,'),
    ('Photos tab (before/after)',             30.65, 32.00, E['photos'] + 0.2, E['photos'] + 1.75, 'photo portfolios,'),
    ('Leads tab (lead card)',                 32.00, 33.20, E['leads'] + 1.2, E['leads'] + 2.4, 'lead management.'),
    ('Home dashboard',                        33.20, 35.25, E['home'] + 0.2, E['home_end'], 'Everything in one place.'),
    ('Public invoice page (customer view)',   35.25, 38.55, E['pub_inv'] + 0.1, E['pub_inv_end'], 'Stay stacked. Stay organized. Stay ahead.'),
    ('End card: letstaystacked.com',          38.55, TOTAL, None, None, "Go to letstaystacked.com today and let's stack work."),
]
CAPS = [(0.00,'Work hard.'),(1.00,'Every job.'),(2.00,'Every estimate.'),(3.04,'Every follow-up.'),(4.20,"It's on you."),
    (5.22,'But what if running your business'),(6.30,'was actually easy?'),(8.30,'Meet StackedWork.'),(9.64,'The app built for contractors'),
    (11.38,'who are serious about getting paid'),(12.92,'and staying organized.'),(15.10,'Log jobs in seconds.'),(16.82,'Track every dollar.'),
    (18.02,'Send professional estimates'),(19.32,'from your phone.'),(20.52,'And when a lead comes in,'),(22.02,"you're the first to know."),
    (23.46,'Already using five different apps'),(25.22,'just to keep up,'),(27.02,'StackedWork replaces all of them.'),(28.86,'Job tracking,'),
    (29.86,'invoicing,'),(30.68,'photo portfolios,'),(32.04,'lead management.'),(33.22,'Everything in one place.'),(35.28,'Stay stacked.'),
    (36.44,'Stay organized.'),(37.84,'Stay ahead.'),(38.66,'Go to letstaystacked.com'),(40.36,"today and let's stack work.")]
CAP_END = 43.4
def vtt_time(t): h = int(t // 3600); m = int(t % 3600 // 60); return f'{h:02d}:{m:02d}:{t % 60:06.3f}'

def frames():
    fl, report = [], []
    for lab, oa, ob, sa, sb, words in BEATS:
        n = round(ob * FPS) - round(oa * FPS)
        if sa is None: seg = [f'{WORK}/endcard_1688.jpg'] * n; sp = None
        else:
            sp = max(1.0, (sb - sa) / (ob - oa)); seg = [frame_at(min(sb, sa + k / FPS * sp)) for k in range(n)]
        fl += seg; report.append({'beat': lab, 'out': [oa, ob], 'src': None if sa is None else [round(sa, 2), round(sb, 2)], 'speed': None if sp is None else round(sp, 2), 'vo': words})
    return fl, report

def render():
    # same frame size as the take so the concat demuxer never reinitialises the filter graph (that drops caption overlays)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', f'{REC}/endcard.jpg', '-vf', 'pad=780:1688:0:0:color=0x15233F,format=yuvj420p', '-q:v', '2', f'{WORK}/endcard_1688.jpg'], check=True)
    fl, beats = frames()
    with open(f'{WORK}/v.list', 'w') as fh:
        for f in fl: fh.write(f"file '{f}'\nduration {1/FPS:.6f}\n")
        fh.write(f"file '{fl[-1]}'\n")
    caps = [(t, CAPS[i + 1][0] - 0.04 if i + 1 < len(CAPS) else CAP_END, txt) for i, (t, txt) in enumerate(CAPS)]
    json.dump([{'text': c[2]} for c in caps], open(f'{WORK}/caps.json', 'w'))
    subprocess.run(['node', f'{REC}/captions.js', f'{WORK}/caps.json', f'{WORK}/caps', '780'], check=True, cwd=REC)
    inputs = ['-f', 'concat', '-safe', '0', '-i', f'{WORK}/v.list']
    for i in range(len(caps)): inputs += ['-i', f'{WORK}/caps/cap{i}.png']
    fc = '[0:v]fps=30,crop=780:1568:0:0,format=yuv420p[v0];'; last = 'v0'
    for i, (a, b, _) in enumerate(caps):
        fc += f"[{last}][{i+1}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[v{i+1}];"; last = f'v{i+1}'
    fc += f'[{last}]scale=720:1448:flags=lanczos[vout]'
    crf = os.environ.get('CRF', '25')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-nostdin', '-y', *inputs, '-filter_complex', fc, '-map', '[vout]', '-t', f'{TOTAL:.2f}',
                    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', crf, '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-tune', 'animation', '-an', f'{WORK}/video.mp4'], check=True, timeout=1800)
    # Reference transcript only; not shipped (captions are burned in, and the site player has no <track>).
    with open(f'{OUT}/demo-full.en.vtt', 'w') as fh:
        fh.write('WEBVTT\n\n' + '\n'.join(f'{i}\n{vtt_time(a)} --> {vtt_time(b)}\n{t}\n' for i, (a, b, t) in enumerate(caps, 1)))
    return beats, caps

def mixdown():
    rep = {'music': audio.music_bed(TOTAL, f'{WORK}/music.wav', -23.0)}
    rep['mix'] = audio.mix([(VO, 0.0)], TOTAL, f'{WORK}/music.wav', WORK, f'{WORK}/mix.wav')
    return rep

if __name__ == '__main__':
    beats, caps = render(); rep = mixdown()
    out = f'{OUT}/demo-full.mp4'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-nostdin', '-y', '-i', f'{WORK}/video.mp4', '-i', f'{WORK}/mix.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', '-t', f'{TOTAL:.2f}', '-movflags', '+faststart', out], check=True)
    rep['final'] = {'lufs_tp': audio.lufs(out), 'size': os.path.getsize(out)}
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    import re; s = r[r.rfind('Summary:'):]; rep['final']['true_peak_dbtp'] = float(re.search(r'True peak:\s+Peak:\s+(-?[\d.]+)', s).group(1)) if 'True peak' in s else None
    rep['beats'] = beats; json.dump(rep, open(f'{OUT}/report.json', 'w'), indent=1)
    print(json.dumps({k: rep[k] for k in ('music', 'mix', 'final')}, indent=1))
