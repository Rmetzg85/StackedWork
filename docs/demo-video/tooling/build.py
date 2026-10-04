#!/usr/bin/env python3
"""Cuts take4 into the hero loop / full demo. Real frames only; segments are sped up, nothing is staged."""
import json, subprocess, sys, os
TAKE = os.environ.get('TAKE', 'take4'); FPS = 30
ev = {e['name']: e['t'] for e in json.load(open(f'{TAKE}/events.json'))}
t0 = ev['start']; T = {k: v - t0 for k, v in ev.items()}
fr = json.load(open(f'{TAKE}/frames.json'))
ft = [(f['t'] - t0, f['i']) for f in fr]

def frame_at(s):
    lo, hi = 0, len(ft) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if ft[mid][0] <= s: lo = mid
        else: hi = mid - 1
    return ft[lo][1]

def render(segments, captions, name, extra_tail=0.0):
    """segments: [(src_a, src_b, speed)], captions: [(text, out_a, out_b)]"""
    files = []; out_t = 0.0; seg_out = []
    for a, b, sp in segments:
        n = round((b - a) / sp * FPS)
        seg_out.append((out_t, out_t + n / FPS)); out_t += n / FPS
        files += [f'{TAKE}/frames/{frame_at(a + k / FPS * sp):05d}.jpg' for k in range(n)]
    files += [files[-1]] * round(extra_tail * FPS)
    with open(f'{name}.list', 'w') as fh:
        for f in files: fh.write(f"file '{os.path.abspath(f)}'\nduration {1/FPS:.6f}\n")
        fh.write(f"file '{os.path.abspath(files[-1])}'\n")
    json.dump([{'text': c[0]} for c in captions], open(f'{name}.caps.json', 'w'))
    subprocess.run(['node', 'captions.js', f'{name}.caps.json', f'{name}-caps', '780'], check=True)
    # master: crop the bottom tab bar (keep 780x1568), overlay captions over the app header
    inputs = ['-f', 'concat', '-safe', '0', '-i', f'{name}.list']
    for i in range(len(captions)): inputs += ['-i', f'{name}-caps/cap{i}.png']
    fc = '[0:v]fps=30,crop=780:1568:0:0,format=yuv420p[v0];'
    last = 'v0'
    for i, (txt, a, b) in enumerate(captions):
        fc += f"[{last}][{i+1}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[v{i+1}];"; last = f'v{i+1}'
    fc = fc.rstrip(';')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *inputs, '-filter_complex', fc, '-map', f'[{last}]', '-c:v', 'libx264', '-crf', '12', '-preset', 'slow', '-pix_fmt', 'yuv420p', f'{name}-master.mp4'], check=True)
    total = len(files) / FPS
    print(name, 'duration', round(total, 2), 'segments(out):', [(round(a, 2), round(b, 2)) for a, b in seg_out])
    return seg_out, total

if __name__ == '__main__':
    # Hero loop (~25 s)
    segs = [
        (1.6, T['voice_start'], 2.0),              # jobs -> + New Job
        (T['voice_start'], T['voice_spoken'] + 0.3, 1.6),  # listening, transcript appears live
        (T['voice_spoken'] + 0.3, T['save_click'], 1.3),   # parsed + filled fields, scroll
        (T['save_click'], T['job_saved'] + 0.4, 1.1),      # saved
        (T['job_saved'] + 0.4, T['est_saved'] + 0.6, 2.6), # write estimate
        (T['est_saved'] + 0.6, T['public_nav'], 1.3),      # detail + share link
        (T['public_nav'], T['public_loaded'], 4.0),         # page load
        (T['public_loaded'], T['end'], 1.15),               # public estimate
    ]
    seg_out = []; t = 0
    for a, b, sp in segs: d = round((b - a) / sp * FPS) / FPS; seg_out.append((t, t + d)); t += d
    S = seg_out
    caps = [
        ('Say the job out loud', 0.0, S[1][1]),
        ('It fills in the details', S[2][0], S[2][0] + 3.4),
        ('Check it, then save', S[2][0] + 3.4, S[3][0] + 0.3),
        ('Saved to your jobs', S[3][0] + 0.3, S[3][1]),
        ('Write the estimate', S[4][0], S[4][1]),
        ('Share the link', S[5][0], S[6][1]),
        ('Your customer sees this', S[7][0], S[7][1] + 1),
    ]
    if 'full' not in sys.argv: render(segs, caps, 'loop')

def full():
    """Tap-to-play version: same real frames, slower cut, narrator VO + the real phrase the app heard + music bed."""
    PH = 6.141678  # phrase.wav duration
    # (src_a, src_b, speed, hold_after)
    segs = [
        (1.6, T['voice_start'], 1.0, 2.4),
        (T['voice_start'], T['voice_spoken'] + 0.3, 1.0, 0),
        (T['voice_spoken'] + 0.3, T['save_click'], 1.0, 0.2),
        (T['save_click'], T['job_saved'] + 0.4, 1.0, 0),
        (T['job_saved'] + 0.4, T['est_saved'] + 0.6, 2.0, 0),
        (T['est_saved'] + 0.6, T['public_nav'], 1.0, 0.3),
        (T['public_nav'], T['public_loaded'], 4.0, 0),
        (T['public_loaded'], T['end'], 1.0, 0.4),
    ]
    files = []; S = []; t = 0.0
    for a, b, sp, hold in segs:
        n = round((b - a) / sp * FPS); fl = [f'{TAKE}/frames/{frame_at(a + k / FPS * sp):05d}.jpg' for k in range(n)]
        fl += [fl[-1]] * round(hold * FPS); files += fl; S.append((t, t + len(fl) / FPS)); t += len(fl) / FPS
    END = 4.0; S.append((t, t + END)); files += ['endcard.jpg'] * round(END * FPS); total = len(files) / FPS
    with open('full.list', 'w') as fh:
        for f in files: fh.write(f"file '{os.path.abspath(f)}'\nduration {1/FPS:.6f}\n")
        fh.write(f"file '{os.path.abspath(files[-1])}'\n")
    caps = [('Say the job out loud', 0.0, S[1][1]), ('It fills in the details', S[2][0], S[2][0] + 5.2), ('Check it, then save', S[2][0] + 5.2, S[3][0] + 0.3),
            ('Saved to your jobs', S[3][0] + 0.3, S[3][1]), ('Write the estimate', S[4][0], S[4][1]), ('Share the link', S[5][0], S[6][1]), ('Your customer sees this', S[7][0], S[7][1])]
    json.dump([{'text': c[0]} for c in caps], open('full.caps.json', 'w'))
    subprocess.run(['node', 'captions.js', 'full.caps.json', 'full-caps', '780'], check=True)
    # audio placements (seconds in output)
    phrase_src = T['voice_spoken'] - PH - 0.05
    place = [('vo/a.wav', 0.35), ('phrase.wav', S[1][0] + (phrase_src - T['voice_start'])), ('vo/c.wav', S[2][0] + 1.4), ('vo/d.wav', S[2][0] + 5.6),
             ('vo/e.wav', S[4][0] + 0.4), ('vo/f.wav', S[5][0] + 0.6), ('vo/g.wav', S[7][0] + 0.5), ('vo/h.wav', S[8][0] + 0.4)]
    inputs = ['-f', 'concat', '-safe', '0', '-i', 'full.list']
    for i in range(len(caps)): inputs += ['-i', f'full-caps/cap{i}.png']
    na = len(caps) + 1
    for f, _ in place: inputs += ['-i', f]
    inputs += ['-i', 'music.wav']
    fc = '[0:v]fps=30,crop=780:1568:0:0,format=yuv420p[v0];'; last = 'v0'
    for i, (txt, a, b) in enumerate(caps):
        fc += f"[{last}][{i+1}:v]overlay=0:0:enable='between(t,{a:.2f},{b:.2f})'[v{i+1}];"; last = f'v{i+1}'
    fc += f"[{last}]scale=720:1448:flags=lanczos[vout];"
    for j, (f, at) in enumerate(place):
        ms = int(at * 1000); fc += f"[{na+j}:a]aresample=44100,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[s{j}];"
    fc += ''.join(f'[s{j}]' for j in range(len(place))) + f"amix=inputs={len(place)}:normalize=0,volume=1.0[voice];"
    fc += "[voice]asplit=2[voice1][vkey];"
    fc += f"[{na+len(place)}:a]atrim=0:{total:.2f},volume=0.30[mus];[mus][vkey]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[duck];"
    fc += f"[voice1][duck]amix=inputs=2:normalize=0,afade=t=out:st={total-1.2:.2f}:d=1.2,loudnorm=I=-16:TP=-1.5:LRA=11[aout]"
    open('full-cmd.json','w').write(json.dumps(['ffmpeg', '-y', *inputs, '-filter_complex', fc])); subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *inputs, '-filter_complex', fc, '-map', '[vout]', '-map', '[aout]', '-t', f'{total:.2f}',
                    '-c:v', 'libx264', '-preset', 'veryslow', '-crf', '24', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-tune', 'animation',
                    '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', '-movflags', '+faststart', 'out/demo-full.mp4'], check=True)
    print('full duration', round(total, 2), [(round(a, 2), round(b, 2)) for a, b in S])
    json.dump({'segments_out': S, 'captions': caps, 'audio': place}, open('full-timeline.json', 'w'), indent=1)

if __name__ == '__main__' and 'full' in sys.argv:
    full()
