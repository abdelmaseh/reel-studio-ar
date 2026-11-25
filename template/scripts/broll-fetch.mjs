#!/usr/bin/env node
// B-roll fetcher for the studio: search free stock footage by keyword and download N clips
// with a license manifest per clip. Written for this sandbox's reality (verified 2026-11-25):
//   coverr  — works keyless, 1080p MP4s on cdn.coverr.co. DEFAULT.
//   mixkit  — keyless but rate-limits aggressively (HTTP 429); retried with backoff.
//   pexels  — needs a free API key:  export PEXELS_API_KEY=...   (api.pexels.com 401s without it)
//   pixabay — needs a free API key:  export PIXABAY_API_KEY=...  (pixabay.com/api 400s without it)
// Usage: node scripts/broll-fetch.mjs "<query>" [--n 3] [--out work/broll] [--source coverr]
// English keywords give far better results on every source; translate Arabic first.
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const args = process.argv.slice(2);
const query = args[0];
if (!query) { console.error('usage: broll-fetch.mjs "<query>" [--n 3] [--out dir] [--source coverr|mixkit|pexels|pixabay]'); process.exit(2); }
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const N = Number(opt('n', 3));
const OUT = opt('out', 'work/broll');
const SOURCE = opt('source', process.env.PEXELS_API_KEY ? 'pexels' : 'coverr');
mkdirSync(OUT, {recursive: true});

const LICENSES = {
  coverr: 'Coverr License: free for commercial use, no attribution required — https://coverr.co/license',
  mixkit: 'Mixkit Stock Video Free License: free for commercial use, no attribution — https://mixkit.co/license/#videoFree',
  pexels: 'Pexels License: free to use, no attribution required — https://www.pexels.com/license/',
  pixabay: 'Pixabay Content License: free to use, no attribution — https://pixabay.com/service/license-summary/',
};

const get = async (url, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, {headers: {'User-Agent': UA}});
    if (r.status === 429 && i < tries - 1) { await new Promise((s) => setTimeout(s, 4000 * (i + 1))); continue; }
    if (!r.ok) throw new Error(`${r.status} on ${url}`);
    return r;
  }
  throw new Error(`429 rate-limited after ${tries} tries on ${url}`);
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60);

async function searchCoverr(q, n) {
  const html = await (await get(`https://coverr.co/s?q=${encodeURIComponent(q)}`)).text();
  const out = [];
  const re = /<a class="video-link" title="([^"]+)" href="(\/videos\/[^"]+)"[\s\S]{0,4000}?cdn\.coverr\.co\/videos\/([a-z0-9-]+)\//g;
  let m;
  while ((m = re.exec(html)) && out.length < n) {
    out.push({title: m[1], page: `https://coverr.co${m[2]}`, url: `https://cdn.coverr.co/videos/${m[3]}/1080p.mp4`});
  }
  return out;
}

async function searchMixkit(q, n) {
  const html = await (await get(`https://mixkit.co/free-stock-video/${slugify(q)}/`)).text();
  const urls = [...html.matchAll(/https:\/\/assets\.mixkit\.co\/videos[^"]+?\.mp4/g)].map((m) => m[0]);
  const pages = [...html.matchAll(/href="(\/free-stock-video\/[a-z0-9-]+\/?)"/g)].map((m) => `https://mixkit.co${m[1]}`);
  const uniq = (a) => [...new Set(a)];
  return uniq(urls).slice(0, n).map((u, i) => ({title: `mixkit ${q} ${i + 1}`, page: uniq(pages)[i] ?? 'https://mixkit.co', url: u}));
}

async function searchPexels(q, n) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY not set — get a free key at https://www.pexels.com/api/ and export it');
  const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=${n}&orientation=portrait`, {headers: {Authorization: key}});
  if (!r.ok) throw new Error(`pexels ${r.status}`);
  const d = await r.json();
  return (d.videos ?? []).map((v) => {
    const f = [...v.video_files].sort((a, b) => Math.abs((a.height ?? 0) - 1080) - Math.abs((b.height ?? 0) - 1080))[0];
    return {title: `pexels by ${v.user?.name ?? 'unknown'}`, page: v.url, url: f.link};
  });
}

async function searchPixabay(q, n) {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new Error('PIXABAY_API_KEY not set — get a free key at https://pixabay.com/api/docs/ and export it');
  const r = await fetch(`https://pixabay.com/api/videos/?key=${key}&q=${encodeURIComponent(q)}&per_page=${n}`);
  if (!r.ok) throw new Error(`pixabay ${r.status}`);
  const d = await r.json();
  return (d.hits ?? []).map((h) => ({title: `pixabay ${h.tags ?? q}`, page: h.pageURL, url: h.videos?.large?.url ?? h.videos?.medium?.url}));
}

const SEARCH = {coverr: searchCoverr, mixkit: searchMixkit, pexels: searchPexels, pixabay: searchPixabay};

const results = await SEARCH[SOURCE](query, N);
if (!results.length) { console.error(`no ${SOURCE} results for "${query}" — try English keywords or another --source`); process.exit(1); }

const manifest = [];
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const name = `${String(i + 1).padStart(2, '0')}-${slugify(query)}-${SOURCE}.mp4`;
  const path = join(OUT, name);
  const resp = await get(r.url);
  writeFileSync(path, Buffer.from(await resp.arrayBuffer()));
  manifest.push({file: path, title: r.title, source: SOURCE, page: r.page, license: LICENSES[SOURCE]});
  console.log(`[${i + 1}/${results.length}] ${name}  <-  ${r.page}`);
}
writeFileSync(join(OUT, `manifest-${slugify(query)}.json`), JSON.stringify({query, source: SOURCE, clips: manifest}, null, 2));
console.log(`\n${manifest.length} clip(s) + manifest in ${OUT}/ — licenses: ${LICENSES[SOURCE]}`);
