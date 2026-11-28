#!/usr/bin/env node
// Delivery QA gate — adapted to our ffmpeg flow from reel-studio's delivery-QA concept
// (decode, black/freeze frames, audio level) plus an Arabic caption lint built on the
// vendored reel-studio arabic module (Apache-2.0, https://github.com/mohamedabdou-ai/reel-studio).
//
// Usage: node scripts/qa-gate.mjs <file.mp4> [--captions captions.json] [--max-mb 14]
//          [--max-shot-sec 4.5] [--hook-by-sec 2.0] [--scene-th 0.25] [--no-pacing] [--props props.json]  (pacing lint; --props uses declared beat starts instead of scene detection)
//          [--min-word-sec 0.12] [--max-words-per-sec 4.5]  (caption timing lint)
//          [--expect-video-sec N] [--expect-audio] [--fps 60] [--size 1080x1920]
// Exit 1 on any FAIL. needs-review items print but never block.
import {spawnSync} from 'node:child_process';
import {statSync, readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join, dirname} from 'node:path';
import {joiningTypeOfCode} from '../src/vendor/reel-studio/arabic/joining.ts';
import {kashidaSlots} from '../src/vendor/reel-studio/arabic/kashida.ts';

const args = process.argv.slice(2);
const file = args[0];
if (!file) { console.error('usage: qa-gate.mjs <file.mp4> [--captions x.json] [--max-mb 14] [--expect-video-sec N] [--expect-audio] [--fps 60] [--size 1080x1920]'); process.exit(2); }
if (!existsSync(file)) { console.error(`file not found: ${file}`); process.exit(2); }
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const has = (name) => args.includes('--' + name);
const maxMb = Number(opt('max-mb', 14));

const findings = [];
const fail = (code, detail) => findings.push({level: 'fail', code, detail});
const review = (code, detail) => findings.push({level: 'needs-review', code, detail});
const pass = (code, detail) => findings.push({level: 'pass', code, detail});

// ffmpeg/ffprobe: local copy from INSTALL.sh (<repo>/tools/ffmpeg/bin) first, then PATH
const localBin = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'ffmpeg', 'bin');
const resolveBin = (name) => { for (const f of [name + '.exe', name]) { const p = join(localBin, f); if (existsSync(p)) return p; } return name; };
const run = (cmd, a) => { const r = spawnSync(['ffmpeg', 'ffprobe'].includes(cmd) ? resolveBin(cmd) : cmd, a, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024}); return (r.stdout ?? '') + (r.stderr ?? ''); };

// ---- 1. container spec ----
const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file]) || '{}');
const fmt = probe.format ?? {};
const v = (probe.streams ?? []).find((s) => s.codec_type === 'video');
const a = (probe.streams ?? []).find((s) => s.codec_type === 'audio');
if (!v) fail('no-video-stream', 'file has no video stream');
else {
  const [wn, hn] = String(opt('size', '1080x1920')).split('x').map(Number);
  if (v.width !== wn || v.height !== hn) fail('dimensions', `got ${v.width}x${v.height}, want ${wn}x${hn}`); else pass('dimensions', `${v.width}x${v.height}`);
  const fpsWant = Number(opt('fps', 60));
  const [frN, frD] = String(v.avg_frame_rate ?? '0/1').split('/').map(Number);
  const fps = frD ? frN / frD : 0;
  if (Math.abs(fps - fpsWant) > 0.5) fail('fps', `got ${fps}, want ${fpsWant}`); else pass('fps', String(fps));
  if (v.codec_name !== 'h264') review('codec', `video codec is ${v.codec_name}, expected h264`); else pass('codec', 'h264');
  if (v.pix_fmt !== 'yuv420p') review('pix-fmt', `got ${v.pix_fmt}, WhatsApp wants yuv420p`); else pass('pix-fmt', 'yuv420p');
}
const expectSec = opt('expect-video-sec', null);
if (expectSec !== null && fmt.duration) {
  const d = Number(fmt.duration);
  if (Math.abs(d - Number(expectSec)) > 0.12) fail('duration', `container ${d}s vs expected ${expectSec}s`); else pass('duration', `${d}s`);
}
if (has('expect-audio')) {
  if (!a) fail('no-audio-stream', 'expected an audio stream'); else if (a.codec_name !== 'aac') review('audio-codec', `got ${a.codec_name}, expected aac`); else pass('audio-codec', 'aac');
}
const mb = statSync(file).size / 1048576;
if (mb > maxMb) fail('size', `${mb.toFixed(2)} MB exceeds ${maxMb} MB`); else pass('size', `${mb.toFixed(2)} MB of ${maxMb} MB`);

// ---- 2. full decode ----
const dec = run('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-']);
if (dec.trim()) fail('decode', dec.trim().split('\n')[0]); else pass('decode', 'clean');

// ---- 3. black / freeze frames ----
const black = run('ffmpeg', ['-i', file, '-vf', 'blackdetect=d=0.5:pix_th=0.10', '-an', '-f', 'null', '-']);
const blackHits = [...black.matchAll(/blackdetect.*black_start:([\d.]+) black_end:([\d.]+)/g)];
if (blackHits.length) fail('black-frames', blackHits.map((m) => `${m[1]}-${m[2]}s`).join(', ')); else pass('black-frames', 'none >= 0.5s');
const frz = run('ffmpeg', ['-i', file, '-vf', 'freezedetect=n=0.001:d=1.2', '-an', '-f', 'null', '-']);
const frzHits = [...frz.matchAll(/freeze_start: ([\d.]+)/g)];
if (frzHits.length) review('freeze-frames', `frozen >= 1.2s at ${frzHits.map((m) => m[1]).join(', ')}s`); else pass('freeze-frames', 'none');


// ---- 3b. pacing lint (shot length / hook) — needs-review only, never blocks ----
if (v && !has('no-pacing')) {
  const maxShot = Number(opt('max-shot-sec', 4.5)); const hookBy = Number(opt('hook-by-sec', 2.0));
  const sc = run('ffmpeg', ['-i', file, '-vf', `select='gt(scene,${opt('scene-th', 0.25)})',showinfo`, '-an', '-f', 'null', '-']);
  let cuts = [...sc.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1]));
  // --props props.json: Ad/montage props with declared beats[].from. Dark or one-theme edits fool scene detection, so declared beat starts are the cuts.
  const pf = opt('props', '');
  if (pf && existsSync(pf)) { try { const bs = JSON.parse(readFileSync(pf, 'utf8')).beats ?? []; const d = bs.map((b) => Number(b.from)).filter((x) => x > 0.05).sort((x, y) => x - y); if (d.length) { cuts = d; pass('pacing-source', `using ${d.length} declared beat starts from ${pf}`); } } catch { review('pacing-source', `could not read beats from ${pf}`); } }
  const dur = Number(fmt.duration ?? 0);
  const edges = [0, ...cuts, dur].filter((x, i, arr) => i === 0 || x > arr[i - 1]);
  const shots = edges.slice(1).map((e, i) => +(e - edges[i]).toFixed(2));
  const longShots = shots.map((d, i) => ({d, at: edges[i]})).filter((x) => x.d > maxShot);
  const avg = shots.length ? dur / shots.length : 0;
  if (longShots.length) review('pacing-long-shot', `${longShots.length} shot(s) longer than ${maxShot}s: ${longShots.slice(0, 4).map((x) => `${x.d}s at ${x.at.toFixed(1)}s`).join(', ')} — add a cut, push-in or new beat`);
  else pass('pacing-shots', `${shots.length} shots, longest ${Math.max(0, ...shots)}s, avg ${avg.toFixed(1)}s`);
  if (dur > 6 && (cuts[0] ?? dur) > hookBy) review('pacing-late-hook', `first cut/change at ${(cuts[0] ?? dur).toFixed(1)}s — reels need a visual change by ${hookBy}s`);
}

// ---- 4. audio level ----
if (a) {
  const vol = run('ffmpeg', ['-i', file, '-af', 'volumedetect', '-vn', '-f', 'null', '-']);
  const mean = Number(/mean_volume: ([-\d.]+) dB/.exec(vol)?.[1]);
  const max = Number(/max_volume: ([-\d.]+) dB/.exec(vol)?.[1]);
  if (Number.isFinite(max)) {
    if (max > -0.5) fail('audio-clipping', `max_volume ${max} dB`); else pass('audio-peak', `max ${max} dB`);
    if (max < -25) review('audio-quiet', `max_volume ${max} dB — probably inaudible`);
  }
  if (Number.isFinite(mean) && mean < -45) review('audio-mean-low', `mean_volume ${mean} dB`);
}

// ---- 5. Arabic caption lint ----
const TATWEEL = 'ـ';
const capPath = opt('captions', null);
if (capPath) {
  const caps = JSON.parse(readFileSync(capPath, 'utf8'));
  const words = (caps.words ?? caps).map((w) => (typeof w === 'string' ? w : w.text));
  const isAr = (ch) => { const t = joiningTypeOfCode(ch.codePointAt(0)); return t === 'R' || t === 'D'; };
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      const c = word.codePointAt(i);
      if (c >= 0xfb50 && c <= 0xfdff || c >= 0xfe70 && c <= 0xfeff) fail('presentation-forms', `«${word}» uses a presentation-form codepoint — use plain Arabic letters`);
      if ((c === 0x200c || c === 0x200d) && i > 0 && i < word.length - 1 && isAr(word[i - 1]) && isAr(word[i + 1])) fail('zwnj-in-word', `«${word}» has a joiner inside the word — breaks shaping`);
    }
    if (word.startsWith(TATWEEL) || word.endsWith(TATWEEL)) fail('tatweel-edge', `«${word}» carries a tatweel at a word edge`);
    if (word.includes(TATWEEL)) {
      const base = word.replaceAll(TATWEEL, '');
      if (kashidaSlots(base).length === 0) fail('kashida-illegal', `«${word}» is stretched but «${base}» has no legal kashida slot`);
    }
    if (/[؀-ۿ]/.test(word) && /[A-Za-z]/.test(word)) review('mixed-direction', `«${word}» mixes Arabic and Latin letters — check the frame visually`);
    if (word.length > 40) review('long-token', `«${word.slice(0, 40)}…» is ${word.length} chars`);
  }
  if (!findings.some((f) => f.level === 'fail' && ['presentation-forms', 'zwnj-in-word', 'tatweel-edge', 'kashida-illegal'].includes(f.code))) pass('arabic-lint', `${words.length} words clean`);

  // ---- 5b. caption timing lint (needs {text,start,end} words in seconds) ----
  const timed = (caps.words ?? caps).filter((w) => w && typeof w === 'object' && Number.isFinite(w.start) && Number.isFinite(w.end));
  if (timed.length) {
    const before = findings.length;
    const minDur = Number(opt('min-word-sec', 0.12));
    const maxWps = Number(opt('max-words-per-sec', 4.5));
    timed.forEach((w, i) => {
      const prev = timed[i - 1];
      if (w.end <= w.start) fail('caption-zero-duration', `«${w.text}» at ${w.start}s ends at ${w.end}s`);
      else if (w.end - w.start < minDur) review('caption-too-fast', `«${w.text}» shows only ${(w.end - w.start).toFixed(2)}s (< ${minDur}s) — unreadable`);
      if (prev) {
        if (w.start < prev.start) fail('caption-out-of-order', `«${w.text}» starts at ${w.start}s before «${prev.text}» at ${prev.start}s`);
        else if (w.start < prev.end - 0.02) fail('caption-overlap', `«${prev.text}» and «${w.text}» overlap by ${(prev.end - w.start).toFixed(2)}s`);
        else if (w.start - prev.end > 1.5) review('caption-gap', `${(w.start - prev.end).toFixed(1)}s with no caption before «${w.text}» at ${w.start}s`);
      }
    });
    // reading speed over any 2s sliding window
    for (let i = 0; i < timed.length; i++) {
      const n = timed.filter((w) => w.start >= timed[i].start && w.start < timed[i].start + 2).length;
      if (n / 2 > maxWps) { review('caption-reading-speed', `${n} words in 2s from ${timed[i].start}s (> ${maxWps} words/s)`); break; }
    }
    const lastEnd = Math.max(...timed.map((w) => w.end));
    if (fmt.duration) {
      const d = Number(fmt.duration);
      if (lastEnd > d + 0.05) fail('caption-past-end', `last caption ends at ${lastEnd.toFixed(2)}s but video is ${d.toFixed(2)}s`);
      else if (d - lastEnd > 3) review('caption-ends-early', `captions stop ${(d - lastEnd).toFixed(1)}s before the video ends`);
    }
    if (findings.length === before) pass('caption-timing', `${timed.length} words, in order, readable, inside the video`);
  }
}

let bad = 0;
for (const f of findings) {
  const tag = f.level === 'fail' ? 'FAIL' : f.level === 'needs-review' ? 'REVIEW' : ' ok ';
  if (f.level === 'fail') bad++;
  console.log(`[${tag}] ${f.code}: ${f.detail}`);
}
console.log(bad ? `\nQA gate: ${bad} failure(s) — do not deliver.` : '\nQA gate: PASS');
process.exit(bad ? 1 : 0);
