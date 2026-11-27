#!/usr/bin/env node
// Preflight: catch the usual reel mistakes BEFORE a long render.
// Usage: node scripts/preflight.mjs <voiceover.wav|mp3> [props.json] [--fps 30]
// Checks: Node version, ffmpeg/ffprobe, fonts, voiceover length, and (if props.json is given)
// that the planned video length covers the voiceover with a small tail, so the speech finishes
// before the cut, and that no caption runs past the end of the voiceover.
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const fpsIdx = args.indexOf('--fps');
const FPS = fpsIdx >= 0 ? Number(args.splice(fpsIdx, 2)[1]) : 30;
const [vo, propsPath] = args;
const res = [];
const add = (level, name, msg) => res.push({level, name, msg});

const major = Number(process.versions.node.split('.')[0]);
add(major >= 22 ? 'ok' : 'FAIL', 'node', `v${process.versions.node} (need 22.18+)`);

const localFF = join(here, '..', '..', 'tools', 'ffmpeg', 'bin');
const env = {...process.env, PATH: `${localFF}:${process.env.PATH}`};
const run = (cmd, a) => spawnSync(cmd, a, {encoding: 'utf8', env});
for (const t of ['ffmpeg', 'ffprobe']) {
  const r = run(t, ['-version']);
  add(r.status === 0 ? 'ok' : 'FAIL', t, r.status === 0 ? r.stdout.split('\n')[0] : 'not found: run ./INSTALL.sh');
}

const fontDir = join(here, '..', 'public', 'fonts');
const fonts = existsSync(fontDir) ? readdirSync(fontDir).filter((f) => /\.(ttf|otf)$/i.test(f)) : [];
add(fonts.length ? 'ok' : 'FAIL', 'fonts', fonts.length ? `${fonts.length} font file(s) in public/fonts` : 'public/fonts is empty: run ./INSTALL.sh');

let voSec = null;
if (!vo) add('FAIL', 'voiceover', 'no voiceover path given');
else if (!existsSync(vo)) add('FAIL', 'voiceover', `file not found: ${vo}`);
else {
  const r = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vo]);
  voSec = Number(r.stdout.trim());
  add(Number.isFinite(voSec) && voSec > 0 ? 'ok' : 'FAIL', 'voiceover', Number.isFinite(voSec) ? `${voSec.toFixed(2)}s` : 'cannot read duration');
}

if (propsPath) {
  if (!existsSync(propsPath)) add('FAIL', 'props', `file not found: ${propsPath}`);
  else {
    const p = JSON.parse(readFileSync(propsPath, 'utf8'));
    if (typeof p.total === 'number' && voSec) {
      const tail = p.total - voSec;
      add(tail >= 0.3 ? 'ok' : 'FAIL', 'speech-before-cut', `video ${p.total}s, voiceover ${voSec.toFixed(2)}s, tail ${tail.toFixed(2)}s (need 0.3s or more)`);
      add(tail <= 2 ? 'ok' : 'REVIEW', 'dead-air-tail', `tail ${tail.toFixed(2)}s (over 2s feels like dead air)`);
      add('ok', 'frames', `render ${Math.round(p.total * FPS)} frames at ${FPS}fps`);
    } else add('REVIEW', 'props', 'no numeric "total" in props, length check skipped');
    const caps = (p.captions || []).flat();
    const lastEnd = caps.length ? Math.max(...caps.map((c) => c.end ?? 0)) : null;
    if (lastEnd !== null && voSec) add(lastEnd <= voSec + 0.2 ? 'ok' : 'FAIL', 'captions', `last caption ends ${lastEnd.toFixed(2)}s, voiceover ${voSec.toFixed(2)}s`);
  }
}

for (const r of res) console.log(`[${r.level.padEnd(6)}] ${r.name}: ${r.msg}`);
const fails = res.filter((r) => r.level === 'FAIL').length;
console.log(fails ? `\nPreflight: ${fails} problem(s). Fix before rendering.` : '\nPreflight: PASS');
process.exit(fails ? 1 : 0);
