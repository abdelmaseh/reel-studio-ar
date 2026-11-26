#!/usr/bin/env node
// Speech-aware cut points: midpoints of silences in a voiceover/audio track (cut here and the edit never chops a word).
// Usage: node scripts/montage/cut-points.mjs <audio> [--out cuts.json] [--noise -32] [--min-silence 0.18]
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {bin} from './lib.mjs';

export function silenceCutPoints(file, {noise = -32, minSilence = 0.18} = {}) {
  const r = spawnSync(bin('ffmpeg'), ['-hide_banner', '-i', file, '-af', `silencedetect=noise=${noise}dB:d=${minSilence}`, '-f', 'null', '-'], {encoding: 'utf8', maxBuffer: 1 << 26});
  const txt = (r.stderr ?? '') + (r.stdout ?? '');
  const starts = [...txt.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const ends = [...txt.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return starts.map((s, i) => ({start: +s.toFixed(3), end: +(ends[i] ?? s).toFixed(3), mid: +((s + (ends[i] ?? s)) / 2).toFixed(3)}));
}

if (process.argv[1]?.endsWith('cut-points.mjs')) {
  const a = process.argv.slice(2); if (!a[0]) { console.error('usage: cut-points.mjs <audio> [--out cuts.json] [--noise -32] [--min-silence 0.18]'); process.exit(2); }
  const o = (n, d) => { const i = a.indexOf('--' + n); return i >= 0 ? a[i + 1] : d; };
  const pts = silenceCutPoints(a[0], {noise: Number(o('noise', -32)), minSilence: Number(o('min-silence', 0.18))});
  console.log(`${pts.length} silence gaps`); if (o('out', null)) writeFileSync(o('out'), JSON.stringify(pts)); else console.log(JSON.stringify(pts.slice(0, 20)));
}
