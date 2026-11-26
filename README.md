# Reel Studio استوديو الريل

A complete, batteries-included pipeline for producing premium vertical Arabic ad reels
(1080x1920, 60fps delivery container, H.264+AAC, WhatsApp-ready under 14 MB) with
Remotion 4. One command installs everything; one script renders end to end.

## Features

- **Real motion blur** via `@remotion/motion-blur` (`CameraBlur`, `Smear`) with shutter
  presets — no more render-at-4x-fps oversampling. A documented 50fps × 4-subframe
  fallback stays in the runbook.
- **Arabic done right**: Tajawal per-word RTL captions driven by Whisper word timings,
  with a real kashida (tatweel) engine that only stretches legal joining slots, plus a
  lint gate that blocks delivery on broken shaping (split joins, presentation forms,
  tatweel at word edges, ZWJ inside words).
- **8 curated transitions** ported from reel-studio's transitions-v4: page-turn
  (Arabic-book direction), ink-slab, lens-zoom, iris, dot-zoom, zoom-through, blinds,
  plus whip-pan with built-in speed-based blur and a light-scan sheen.
- **6 named visual styles** (`cinematic`, `gold`, `minimal`, `pop`, `vhs`, `3d`; the new `3d` keeps pop energy with real depth: perspective, parallax layers, contact shadows, DOF blur, extruded text; see RUNBOOK section 3D and `Demo3D`) — each sets
  palette, caption treatment, default transition, grain/vignette and SFX flavor.
  Switch a whole reel with one constant.
- **108-move catalog** with energy/family/cue metadata and a planner discipline
  (3 core moves + accents per video) adapted from video-ad-editor.
- **408-sound CC0 SFX pack** with a searchable catalog.
- **B-roll fetcher**: `broll-fetch.mjs` searches and downloads free stock clips
  (Coverr keyless by default; Mixkit; Pexels/Pixabay with free API keys) and writes a
  license manifest per clip.
- **Audio-reactive graphics**: band/energy/ducking/onset analysis hooks (`audioviz.ts`).
- **Delivery QA gate**: container spec, full decode, black/freeze-frame detection,
  audio peak level, and the Arabic caption lint. The gate fails, the reel doesn't ship.

## Quickstart

**Requirements:** Node.js 18+, Git, curl. On Windows use **Git Bash**
(`winget install OpenJS.NodeJS.LTS` and `winget install Git.Git`). `INSTALL.sh` checks them first and
tells you exactly what is missing. **ffmpeg/ffprobe are installed automatically** into `tools/ffmpeg/bin`
inside the repo if they are not already on your PATH (no admin rights, no PATH edits;
`render-reel.sh` and `qa-gate.mjs` use that local copy first). macOS: `brew install ffmpeg`.

```bash
./INSTALL.sh                      # one-command setup (node modules, fonts, SFX, vendor copy)
cd template
npx remotion still src/index.ts Demo /tmp/preview.png --frame=45   # smoke test
bash scripts/render-reel.sh Demo 250 out.mp4 --mix mix.txt
node scripts/qa-gate.mjs out.mp4 --captions captions.json --expect-audio
```

Then read **RUNBOOK.md** — it is the full production manual (Egyptian Arabic + English):
shot list discipline, physics rules, caption gate, B-roll workflow, QA, compression.

## Style gallery

| `cinematic` | `gold` | `minimal` | `pop` | `vhs` |
|---|---|---|---|---|
| dark teal/orange, our default premium look | luxury gold on black | clean light minimal | loud pop colors | gritty VHS/brutalist hooks |

Set it once in `template/src/styles.ts` (`ACTIVE_STYLE`) or per composition via
`defaultProps: {styleName: 'gold'}`.

## Layout

```
INSTALL.sh            one-command setup, safe to re-run
RUNBOOK.md            production manual (AR + EN)
README.md             this file
LICENSE / ATTRIBUTION.md / LICENSES/
vendor/               ported modules with their license headers (see ATTRIBUTION.md)
template/             the Remotion project (src/, scripts/, public/)
assets/sfx/           CC0 sound pack (cloned by INSTALL.sh)
```

## About the author

<p align="center"><img src="docs/author.jpg" alt="Siha Refaat" width="160" style="border-radius:50%"></p>

**Siha Refaat**, builder of Reel Studio. I make tools that turn a single word into a finished, cinematic Arabic reel.

- Telegram: [t.me/abdelmasehrefaat](https://t.me/abdelmasehrefaat)
- Instagram: [@si7a_ref3t_](https://instagram.com/si7a_ref3t_)

Questions, ideas or a shout-out are welcome on either account.

---

## Credits

Built on the shoulders of three open projects — see ATTRIBUTION.md for the full notices:
[mohamedabdou-ai/reel-studio](https://github.com/mohamedabdou-ai/reel-studio) (Apache-2.0),
[majedphotos/video-ad-editor](https://github.com/majedphotos/video-ad-editor) (MIT),
[Reodelbasalan/adbertiser-sfx](https://github.com/Reodelbasalan/adbertiser-sfx) (CC0),
plus the cinematic-motion craft references. Tajawal font (OFL). Remotion (remotion.dev).

---

## بالعربي

استوديو متكامل لإنتاج ريلز إعلانية عربية بجودة بريميوم (1080x1920، كونتينر 200 فريم،
أقل من 14 ميجا للواتساب). التثبيت أمر واحد `./INSTALL.sh`، والإنتاج كله موثّق خطوة
بخطوة في RUNBOOK.md: بلور حقيقي، كابشن عربي بالكشيدة على توقيتات Whisper، ٨ انتقالات،
٥ ستايلات جاهزة تتبدل بسطر واحد، مكتبة ٤٠٨ مؤثر صوتي، سكريبت سحب لقطات B-roll مجانية
بالترخيص، وبوابة فحص جودة ما تعدّيش التسليم لو فيه حاجة بايظة.


## عن المؤلف

<p align="center"><img src="docs/author.jpg" alt="صيحة رفعت" width="160"></p>

**Siha Refaat**، صاحب مشروع Reel Studio. بعمل أدوات بتحوّل كلمة واحدة لريل عربي سينمائي كامل.

- تيليجرام: [t.me/abdelmasehrefaat](https://t.me/abdelmasehrefaat)
- إنستجرام: [@si7a_ref3t_](https://instagram.com/si7a_ref3t_)

لو عندك فكرة أو سؤال أو جربت الاستوديو، كلمني على أي حساب فيهم.
