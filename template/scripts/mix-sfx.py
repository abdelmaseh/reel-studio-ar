#!/usr/bin/env python3
"""Mix the voiceover with movement-synced SFX (a whoosh 1 frame early on every beat change). No background bed.
Usage: python3 scripts/mix-sfx.py props.json vo.wav out.wav [--sfx path/to/whoosh.wav] [--vol 0.25]
props.json is the Ad props (beats[].from in seconds). Output is loudness-normalised (-16 LUFS, -1.5 dB peak).
"""
import json, subprocess, sys, os
a = sys.argv[1:]
vol = 0.25; sfx = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'sfx', 'sounds', 'whoosh', 'whoosh_air_1.wav')
if '--vol' in a: i = a.index('--vol'); vol = float(a[i + 1]); del a[i:i + 2]
if '--sfx' in a: i = a.index('--sfx'); sfx = a[i + 1]; del a[i:i + 2]
props, vo, out = a
d = json.load(open(props)); beats = d['beats'][1:]
cmd = ['ffmpeg', '-y', '-v', 'error', '-i', vo]; f = ''; lab = '[0:a]'
for n, b in enumerate(beats):
    ms = max(0, int((b['from'] - 1 / 30) * 1000)); cmd += ['-i', sfx]
    f += f'[{n + 1}:a]adelay={ms}|{ms},volume={vol}[s{n}];'; lab += f'[s{n}]'
f += lab + f'amix=inputs={len(beats) + 1}:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[o]'
subprocess.run(cmd + ['-filter_complex', f, '-map', '[o]', '-ar', '48000', '-t', str(d['total']), out], check=True)
print(f'{len(beats)} whooshes mixed, no bed -> {out}')
