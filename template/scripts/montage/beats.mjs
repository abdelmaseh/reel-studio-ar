#!/usr/bin/env node
// Beat / onset detector for beat-synced cutting. Pure JS on top of ffmpeg.
// Usage: node scripts/montage/beats.mjs <audio-or-video> [--out beats.json] [--min-gap 0.25] [--sens 1.4]
// Output: {bpm, confidence, onsets:[sec], beats:[sec]}  (beats = onsets regularised onto the fitted tempo grid)
import {writeFileSync} from 'node:fs';
import {decodeMono} from './lib.mjs';

export function detectBeats(samples, rate, {minGap = 0.25, sens = 1.4} = {}) {
  const hop = 512; const frames = Math.floor(samples.length / hop);
  const e = new Float32Array(frames);
  // energy of a first-difference (high-pass) signal: emphasises clicks/kicks/snares over sustained notes
  for (let f = 0; f < frames; f++) { let s = 0; for (let i = f * hop + 1; i < (f + 1) * hop; i++) { const d = samples[i] - samples[i - 1]; s += d * d; } e[f] = Math.log(1 + 1000 * s / hop); }
  const flux = new Float32Array(frames); for (let f = 1; f < frames; f++) flux[f] = Math.max(0, e[f] - e[f - 1]);
  const win = Math.round(rate / hop); // ~1s local statistics
  const onsets = []; let last = -1e9;
  for (let f = 2; f < frames - 2; f++) {
    let m = 0, v = 0, c = 0; for (let k = Math.max(0, f - win); k < Math.min(frames, f + win); k++) { m += flux[k]; c++; } m /= c;
    for (let k = Math.max(0, f - win); k < Math.min(frames, f + win); k++) v += (flux[k] - m) ** 2; const sd = Math.sqrt(v / c);
    const isPeak = flux[f] >= flux[f - 1] && flux[f] > flux[f + 1] && flux[f] > m + sens * sd && flux[f] > 0.5;
    const t = f * hop / rate;
    if (isPeak && t - last >= minGap) { onsets.push(+t.toFixed(3)); last = t; }
  }
  // tempo: histogram of inter-onset intervals folded into 70-180 BPM
  const hist = new Map();
  for (let i = 1; i < onsets.length; i++) for (let j = 1; j <= 3 && i - j >= 0; j++) {
    let bpm = 60 / ((onsets[i] - onsets[i - j]) / 1); while (bpm < 70) bpm *= 2; while (bpm > 180) bpm /= 2;
    const k = Math.round(bpm); hist.set(k, (hist.get(k) ?? 0) + 1);
  }
  let bpm = 0, top = 0; for (const [k, n] of hist) { const s = (hist.get(k - 1) ?? 0) + n + (hist.get(k + 1) ?? 0); if (s > top) { top = s; bpm = k; } }
  const total = [...hist.values()].reduce((a, b) => a + b, 0) || 1;
  // grid: fit phase = median offset of onsets modulo period, then lay beats over the clip length
  const beats = [];
  if (bpm) {
    const p = 60 / bpm; const offs = onsets.map((o) => o % p).sort((a, b) => a - b);
    // circular median-ish: use the offset with most neighbours within 40 ms
    let ph = 0, bestN = -1; for (const o of offs) { const n = offs.filter((x) => Math.abs(x - o) < 0.04 || Math.abs(x - o) > p - 0.04).length; if (n > bestN) { bestN = n; ph = o; } }
    for (let t = ph; t < samples.length / rate; t += p) beats.push(+t.toFixed(3));
  }
  // confidence = share of detected onsets that land within 40 ms of a grid beat
  const confidence = onsets.length ? +(onsets.filter((o) => beats.some((b) => Math.abs(b - o) < 0.04)).length / onsets.length).toFixed(2) : 0;
  return {bpm, confidence, onsets, beats};
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('beats.mjs')) {
  const a = process.argv.slice(2); const file = a[0];
  if (!file) { console.error('usage: beats.mjs <audio-or-video> [--out beats.json] [--min-gap 0.25] [--sens 1.4]'); process.exit(2); }
  const o = (n, d) => { const i = a.indexOf('--' + n); return i >= 0 ? a[i + 1] : d; };
  const {samples, rate} = decodeMono(file);
  const res = detectBeats(samples, rate, {minGap: Number(o('min-gap', 0.25)), sens: Number(o('sens', 1.4))});
  console.log(`bpm ${res.bpm} (confidence ${res.confidence}), ${res.onsets.length} onsets, ${res.beats.length} grid beats`);
  if (o('out', null)) writeFileSync(o('out'), JSON.stringify(res)); else console.log(JSON.stringify({bpm: res.bpm, beats: res.beats.slice(0, 16)}));
}
