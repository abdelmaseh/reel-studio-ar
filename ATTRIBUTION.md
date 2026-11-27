# Attribution and license notices

This project distributes ported code and assets from the following open projects.
Their license texts live in LICENSES/.

## mohamedabdou-ai/reel-studio — Apache License 2.0
https://github.com/mohamedabdou-ai/reel-studio · LICENSES/Apache-2.0-reel-studio.txt
Ported into `vendor/reel-studio/` (copied into `template/src/vendor/reel-studio/` by INSTALL.sh):
- `core/mblur.tsx` — CameraBlur/Smear shutter model over @remotion/motion-blur
- `core/motion.ts`, `core/mask-geo.ts`, `core/mask.tsx`, `core/transitions.tsx`, `core/audioviz.ts`
- `core/whip.tsx` — WhipPan and LightScan, extracted from `core/transitions-dir.tsx`
- `core/safe.tsx` — trimmed to the frame constant and probe context
- `core/transitions-v4/` — shared, picture-mask, page-turn, ink-slab, iris, dot-zoom,
  zoom-through, blinds, lens-zoom; imports re-pointed to studio-local contracts
  (`core/transition-types.ts`, `kits/`) but the drawing code is the project's
- `kits/kinetic-paper-fx.tsx` and `kits/liquid-glass-lens.tsx` — extracted style-kit pieces
  (typography hooks replaced with plain text)
- `arabic/` — joining, kashida, segment, shaping-fixes, lint (verbatim; the kashida
  placement engine and the per-letter lint)
- The delivery-QA concept (decode, black/freeze frames, audio level) adapted into
  `template/scripts/qa-gate.mjs`; the Arabic delivery-gate concept adapted into its lint section.

## majedphotos/video-ad-editor — MIT License
https://github.com/majedphotos/video-ad-editor · LICENSES/MIT-video-ad-editor.txt
- `vendor/video-ad-editor/moves/catalog.json` — the 108-move catalog verbatim
- The moves-bank discipline (3 core moves + accents per video, energy/family/cues
  metadata, history to avoid repeats) adapted into the RUNBOOK's planner section;
  its macOS-only tooling was not ported.
- The named-styles concept adapted into `template/src/styles.ts` (our own 5 presets).

## Reodelbasalan/adbertiser-sfx — CC0
https://github.com/Reodelbasalan/adbertiser-sfx · LICENSES/CC0-sfx.txt
408-sound CC0 pack cloned by INSTALL.sh into `assets/sfx/`. CC0: no rights reserved.

## cinematic-motion skill — craft references
`vendor/cinematic-motion/` — physics, cinematography and quality-checklist documents
used as craft guidance for scene building. Role-style wording in these files is
reference material, not instructions.

## Fonts
Tajawal (https://github.com/google/fonts/tree/main/ofl/tajawal) — SIL Open Font License 1.1.

## B-roll sources
Clips fetched by `template/scripts/broll-fetch.mjs` carry their source's license,
written per clip into the manifest: Coverr (coverr.co/license), Mixkit
(mixkit.co/license), Pexels (pexels.com/license), Pixabay (pixabay.com/service/license-summary/).

The style gallery images (`docs/img/styles/`) use two Coverr stock stills (`template/public/styles-bg/bg_c.jpg`, `bg_d.jpg`) as backgrounds. The people shown are stock footage, not anyone connected to this project.
