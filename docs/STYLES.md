# Style pack (approved batch)
All look recipes live in `template/src/styleboard/StyleFrame.tsx` (composition `StyleFrame`, prop `id` 1..10) and the Montage toolkit.
- Hormozi captions: `captionStyle: 'punch'` (PunchCaptions, 1-3 words, heavy Cairo 900, black stroke, one accent word).
- MrBeast style: StyleFrame id 2 (huge bouncy words, sticker + arrow).
- Kinetic typography: StyleFrame id 6.
- Text behind subject / 3D: Montage clip field `behind` + Broll3D Text3D/Callout3D + `scripts/subject_matte.py`.
- Cinematic grade: StyleFrame id 10 (teal-orange, vignette, grain).
- Split screen (use on request): StyleFrame id 7.
- Podcast clip: StyleFrame id 5 (video card, title, waveform, progress bar).
Pacing rules: cut pauses >0.35s, vary punch-ins, a strong punch at most once per 10s, captions mid-chest, SFX 1-3 frames early under the voice.

## External reference sources (for visual comparison)
- Hormozi: kapwing.com/explore/hormozi-style-captions-template, simplified.com/blog/video/alex-hormozi-style-captions, neocut.app/hormozi-style-captions, echowave.io/tools/hormozi-style-captions
- MrBeast: kapwing.com/explore/mr-beast-subtites-template, clipcraft.ai/blog/mrbeast-style-captions
- Karaoke: kapwing.com/explore/karaoke-captions-maker-template, animatemyvideo.com/pro/karaoke-captions
- Documentary lower third: animatemyvideo.com/pro/documentary-lower-third, framecall.com/templates/lower-thirds/documentary-lower-thirds
- Podcast clip: animatemyvideo.com/pro/podcast-clip-template-for-shorts-and-reels
- Kinetic typography: launchframe.io/kinetic-typography-template, coanimator.com/templates/kinetic-reel
- Text behind subject: youtube.com/watch?v=FpPG_F72i9E
- Cinematic grade (teal-orange): youtube.com/watch?v=7n_uLntNZuY
- Written specs: vidpal.ai/blog/how-to-make-hormozi-style-captions-2026, capto.video/blog/hormozi-style-captions-how-to-get-the-look, viewgum.com/guides/edit-a-talking-head-for-shorts


## Style guide: how to pick and use each style
Pick by what the viewer needs to do in the first 2 seconds. One style per reel; use the cinematic grade or the progress bar on top if you want.

| # | Style | Use it for | Rules that make it work | How |
|---|---|---|---|---|
| 1 | Hormozi captions | Talking head, advice, how-to | 1 to 3 words on screen, heavy Cairo 900, black stroke, one accent word, mid-chest | `captionStyle: 'punch'`, StyleFrame `1` |
| 2 | MrBeast pop | Hooks, big claims, reactions | Huge bouncy words, sticker or arrow pointing at the subject, high saturation | `BeastCaptions`, StyleFrame `2` |
| 3 | Karaoke highlight | Voiceover over b-roll, songs, steady speech | The spoken word lights up, the rest stays white | StyleFrame `3` |
| 4 | Documentary lower third | Interviews, expert intros | Name and role in a lower third, slight desaturation, letterbox | StyleFrame `4` |
| 5 | Podcast clip | Cutting a long talk into a short | Video card, title, waveform, progress bar | StyleFrame `5` |
| 6 | Kinetic typography | Voiceover with no footage, key phrases | Words as the visual, one idea per screen, size shows importance | StyleFrame `6` |
| 7 | Split screen | Before/after, comparisons, reactions, story over gameplay | See the split screen rules below | StyleFrame `7` |
| 8 | Hook + progress bar | Any reel that needs to hold to the end | A question in the first 2 seconds, a bar that fills until the payoff | StyleFrame `8` |
| 9 | 3D callouts | Numbers, headlines, chips on top of footage | Callouts in the top band, never over the face | `Broll3D` |
| 10 | Cinematic grade | Brand and mood pieces | Teal-orange grade, vignette, grain; `grade: 'cinematic'` in Montage | StyleFrame `10` |

Text behind subject is a Montage feature, not a StyleFrame: cut the person out with `scripts/subject_matte.py` and use the clip field `behind`.

### Split screen rules (use on request)
- Vertical reels use top and bottom, not side by side (1080x1920 canvas). Unequal splits such as 60/40 work when one clip is the focus.
- Split screen is a format choice, not a growth trick. Use it only when the second clip adds information or keeps the eye moving.
- Pick one audio source, and keep captions out of the platform UI areas (top bar and the bottom 20%).
- Typical pairings: before/after, two products or techniques, reaction, narrated story over continuous footage.
- References: https://autoshort.io/blog/split-screen-video-shorts-reels , https://www.solidlabs.com/ad-patterns/editing/stacked-split-screen , https://reelstck.com/layouts , https://apollovid.com/templates

### Pacing rules for every style
Cut pauses longer than 0.35s. Vary the punch-in. At most one strong punch per 10 seconds. Put SFX 1 to 3 frames before the sound. The speech must finish before the cut, and the QA gate and `npm run preflight` check for it.

## Word-aligned captions and fresh style-9 looks
- `python3 template/scripts/align-captions.py vo.wav script.txt out.json` puts your corrected Arabic text on the real timing of the voiceover (speech and pauses come from the audio, not a flat split). Uses `faster-whisper` for the timeline if installed, otherwise ffmpeg silence detection. Use `out.json` `captions` as the reel's caption chunks.
- Style 9 (3D motion graphics) has 7 looks (the newest, `eshaar-violet`, is the violet brand-ad look: navy pill captions with one yellow keyword and an extruded brand word on top) (`THEMES` in `template/src/broll3d/Broll3D.tsx`). Run `node template/scripts/pick-theme.mjs` before each render and put the printed `theme` number in the `Ad` props: it never repeats the previous pick, so every video comes out with new colors.
- The studio has no background music or bed (the "dots" bed was removed). Movement-synced SFX stay: `python3 template/scripts/mix-sfx.py props.json vo.wav mix.wav` puts the voiceover together with a whoosh on every beat change, and nothing else.
