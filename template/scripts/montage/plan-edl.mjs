#!/usr/bin/env node
// Auto-plan a beat-synced montage from clips + a beats.json (from beats.mjs).
// Usage: node scripts/montage/plan-edl.mjs --clips a.mp4 b.mp4 c.mp4 --beats beats.json [--every 2] [--seconds 20] [--music song.mp3] [--out edl.json]
// Cuts land exactly on beats: every shot is `--every` beats long (default 2); the first shot of each bar of 4 gets a punchier transition.
import {readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {bin} from './lib.mjs';

const a = process.argv.slice(2);
const list = (name) => { const i = a.indexOf('--' + name); if (i < 0) return []; const out = []; for (let k = i + 1; k < a.length && !a[k].startsWith('--'); k++) out.push(a[k]); return out; };
const o = (n, d) => { const i = a.indexOf('--' + n); return i >= 0 ? a[i + 1] : d; };
const clips = list('clips'); if (!clips.length || !o('beats', null)) { console.error('usage: plan-edl.mjs --clips a.mp4 b.mp4 --beats beats.json [--every 2] [--seconds 20] [--music file] [--out edl.json]'); process.exit(2); }
const beats = JSON.parse(readFileSync(o('beats'), 'utf8')).beats; const every = Number(o('every', 2)); const total = Number(o('seconds', 20));
const dur = (f) => Number(spawnSync(bin('ffprobe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}).stdout.trim());
const lens = clips.map(dur);
const grid = beats.filter((b) => b <= total + 1e-6); const cutAt = []; for (let i = 0; i < grid.length; i += every) cutAt.push(grid[i]);
const used = new Map(); const out = [];
for (let i = 0; i < cutAt.length; i++) {
  const t0 = i === 0 ? 0 : cutAt[i]; const t1 = cutAt[i + 1] ?? Math.min(total, cutAt[i] + (grid[1] - grid[0]) * every);
  const d = +(t1 - t0).toFixed(3); if (d < 0.2) continue;
  const ci = i % clips.length; const k = used.get(ci) ?? 0; used.set(ci, k + 1);
  const inT = Math.max(0, Math.min(lens[ci] - d - 0.05, k * d * 1.15));   // walk forward through the clip so repeats never show the same frames
  out.push({src: clips[ci], in: +inT.toFixed(3), dur: d, transition: i === 0 ? 'cut' : (i % 4 === 0 ? 'flash' : ['zoom', 'whip', 'cut'][i % 3]), push: 0.05});
}
const edl = {clips: out, ...(o('music', null) ? {music: {src: o('music'), volume: 0.45}} : {})};
const res = JSON.stringify(edl, null, 1);
if (o('out', null)) writeFileSync(o('out'), res); else console.log(res);
console.error(`${out.length} shots, ${out.reduce((s, c) => s + c.dur, 0).toFixed(2)}s, cuts on beats every ${every}`);
