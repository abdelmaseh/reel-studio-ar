// Shared helpers for the montage toolkit (no dependencies beyond ffmpeg).
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join, dirname} from 'node:path';

const localBin = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'tools', 'ffmpeg', 'bin');
export const bin = (name) => { for (const f of [name + '.exe', name]) { const p = join(localBin, f); if (existsSync(p)) return p; } return name; };

/** Decode any audio/video file to mono float samples at `rate` Hz. */
export function decodeMono(file, rate = 22050) {
  const r = spawnSync(bin('ffmpeg'), ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(rate), '-f', 's16le', '-'], {maxBuffer: 1 << 29});
  if (r.status !== 0) throw new Error(`ffmpeg decode failed: ${r.stderr?.toString().slice(0, 200)}`);
  const b = r.stdout; const n = Math.floor(b.length / 2); const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = b.readInt16LE(i * 2) / 32768;
  return {samples: out, rate};
}

/** Snap each time to the nearest candidate within tol seconds; otherwise keep it. */
export function snapTimes(times, candidates, tol = 0.12) {
  return times.map((t) => {
    let best = null; let bd = Infinity;
    for (const c of candidates) { const d = Math.abs(c - t); if (d < bd) { bd = d; best = c; } }
    return best !== null && bd <= tol ? {from: t, to: best, snapped: true, shift: +(best - t).toFixed(3)} : {from: t, to: t, snapped: false, shift: 0};
  });
}
