#!/usr/bin/env node
// Style 9 gets a fresh look every render. Prints {"theme": N, "name": "..."} to merge into the Ad props.
// Never repeats the previous pick (remembered in scripts/.last-theme, git-ignored).
// Usage: node scripts/pick-theme.mjs [--count 7]
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const names = ['gold-teal', 'violet-magenta', 'lime-graphite', 'ember-red', 'ocean-aqua', 'eshaar-violet', 'mono-ice'];
const f = join(dirname(fileURLToPath(import.meta.url)), '.last-theme');
const last = existsSync(f) ? Number(readFileSync(f, 'utf8')) : -1;
let n; do { n = Math.floor(Math.random() * names.length); } while (n === last);
writeFileSync(f, String(n));
console.log(JSON.stringify({theme: n, name: names[n]}));
