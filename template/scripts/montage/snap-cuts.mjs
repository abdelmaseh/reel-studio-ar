#!/usr/bin/env node
// Snap planned cut times to the beat grid and/or speech silences, and report every shift.
// Usage: node scripts/montage/snap-cuts.mjs cuts.json [--beats beats.json] [--silences cuts-points.json] [--tol 0.12] [--out snapped.json]
// cuts.json: [1.2, 3.4, ...] (seconds). Speech silences win over beats when both are within tolerance (never cut mid-word).
import {readFileSync, writeFileSync} from 'node:fs';
import {snapTimes} from './lib.mjs';

const a = process.argv.slice(2); if (!a[0]) { console.error('usage: snap-cuts.mjs cuts.json [--beats beats.json] [--silences cut-points.json] [--tol 0.12] [--out snapped.json]'); process.exit(2); }
const o = (n, d) => { const i = a.indexOf('--' + n); return i >= 0 ? a[i + 1] : d; };
const cuts = JSON.parse(readFileSync(a[0], 'utf8')); const tol = Number(o('tol', 0.12));
const beats = o('beats', null) ? JSON.parse(readFileSync(o('beats'), 'utf8')).beats : [];
const sil = o('silences', null) ? JSON.parse(readFileSync(o('silences'), 'utf8')).map((s) => s.mid) : [];
const res = cuts.map((t) => { const s = sil.length ? snapTimes([t], sil, tol)[0] : null; return s?.snapped ? {...s, to_kind: 'silence'} : {...snapTimes([t], beats, tol)[0], to_kind: 'beat'}; });
for (const r of res) console.log(`${r.from.toFixed(3)}s -> ${r.to.toFixed(3)}s ${r.snapped ? `(${r.to_kind}, ${r.shift > 0 ? '+' : ''}${r.shift}s)` : '(kept, nothing within tolerance)'}`);
if (o('out', null)) writeFileSync(o('out'), JSON.stringify(res.map((r) => r.to)));
