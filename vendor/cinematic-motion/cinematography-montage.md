# Cinematography, Montage and Grade Reference

Contents: audio-first timeline · pacing · camera · lens and depth · composition · transitions · slow motion · color grade · post stack · captions

## 1. Audio-first timeline
When a voiceover, SRT, or music exists, it is the master clock.
1. Parse the SRT (or detect beats/onsets) into `[{start,end,text}]`.
2. Mark **hit points**: first word of each sentence, emphasized words, numbers, the CTA. Visual events land **0-2 frames before** the audio hit (the eye accepts early, hates late).
3. Place hero motion so its peak velocity coincides with the beat; the settle happens on the following word.
4. Leave breathing room: 0.2-0.5 s of visual stillness or slow drift before the key line.
5. Keep a `HITS = [...]` array and a `SCENES = [...]` array at the top of the code so timing is editable in one place.
6. Music: duck under voice (-12 dB) with 150 ms attack, 400 ms release; sync cuts to bar/beat grid (`60/BPM` s).

## 2. Pacing and structure
- **Hook (0-1.5 s)**: unexpected image/motion, bold claim, or tension (countdown, object about to fall). 
- **Build (middle)**: escalate: closer shots, faster cuts, rising pitch/riser, bigger moves.
- **Money shot**: slow motion or held frame, everything else quiet.
- **Payoff + CTA**: clean, readable, stable frame for 1.5-2.5 s; one action only.
- Shot length rhythm: vary (e.g. 1.2, 0.8, 0.8, 2.0, 0.5). Equal-length shots feel like a slideshow.
- Loopable reels: make last frame match first frame composition.

## 3. Camera language (virtual camera in 2D/2.5D/3D)
Implement a camera object `{x,y,zoom,rot,shakeAmp}` and transform the whole scene by it. Never move objects to fake camera moves when parallax is needed.
| Move | Use | Numbers |
|---|---|---|
| Slow push-in | tension, focus | zoom 1.00 -> 1.06-1.12 over shot, `inOutCubic` |
| Pull-out reveal | scale reveal | zoom 1.3 -> 1.0, `outExpo` |
| Dolly/truck | parallax | layers move at speeds 0.3x, 0.6x, 1x, 1.4x |
| Whip pan | transition | 6-10 frames, heavy horizontal blur, `inOutExpo` |
| Orbit | product/hero | 3D yaw 20-40 deg over 2-3 s |
| Handheld | realism | `fbm` noise: pos +/-2-4 px, rot +/-0.15 deg, 0.8-1.5 Hz |
| Impact shake | hit | amp 12-40 px, rot 1-3 deg, decay `exp(-8 t)`, 6-10 Hz |
| Crash zoom | emphasis | zoom +8-15% in 4-6 frames then settle spring |
| Dutch roll | unease | rot 3-8 deg |
Never leave the camera dead static >1 s. Even "static" shots get 2-3% push-in.

## 4. Lens, depth and focus (the "expensive" look)
- Simulate depth of field: blur layers by `abs(z - focusZ) * strength` (canvas `ctx.filter = 'blur(Npx)'` or pre-blurred layers). Background blur 6-18 px at 1080 wide; foreground elements (dust, bokeh, leaves) heavily blurred and drifting slowly across the frame.
- **Rack focus**: animate `focusZ` from foreground to hero over 0.6-1 s.
- Anamorphic feel: horizontal light streaks on highlights, oval bokeh, slight barrel distortion optional.
- Atmospheric perspective: far layers lower contrast, tinted toward the haze color.

## 5. Composition
- Rule of thirds for the hero; leave **lead room** in the direction of motion.
- 9:16 safe area: keep key content between y = 250 and y = 1570 (of 1920) and x within 6% margins.
- Strong silhouette: hero is the highest contrast element; background is darker/lower saturation.
- Depth layers: foreground / mid / background always (even in 2D).
- Negative space is expensive. Don't fill every area.

## 6. Transitions that look pro
Prefer motion-continuity cuts: the object leaving frame in shot A enters in shot B on the same vector (match cut). Options:
- **Whip/blur wipe** (directional blur + 6-8 frames).
- **Match cut** on shape/color/motion.
- **Object wipe**: a big foreground element passes the lens and covers the cut.
- **Light flash / bloom flare** for magical or impact cuts (2-3 frames white add).
- **Zoom-through** into a detail (scale 1 -> 8 with blur) and out of another.
- **Mask reveal** with an animated shape that follows physical motion.
- **Hard cut on impact** (best cut ever): cut exactly on the hit frame, next shot starts on the aftermath.
Avoid: crossfades, spinning cube, random preset wipes.

## 7. Time control
- Slow motion: speed-ramp `timeScale` with smooth curve over 0.15-0.25 s: 1.0 -> 0.15-0.3 -> hold -> back to 1.0. Remap the *scene time* `tScene = integral(timeScale dt)`, do not just slow the render.
- Pre-compute `tScene(t)` as a lookup so everything (physics, particles, camera) uses `tScene`.
- High-speed-camera look: slow-motion + high contrast + water/dust/particles floating + shallow depth.
- Freeze frame 2-4 frames on impact (hit-stop) then release.

## 8. Color grade
Pick a palette (3 colors + neutral) per project, hold it across shots.
- Cinematic: teal shadows (#0b3a4a-ish) / warm orange highlights (#ffb36b-ish), lifted blacks slightly (never pure #000 flat), highlight rolloff.
- Luxury: deep black/charcoal + gold accent, high contrast, soft glow.
- Tech: dark navy, cyan/violet gradients, crisp grid lines, subtle scanline.
- Warm/food: warm key light, saturated reds/oranges, shallow focus.
Implementation in canvas: draw scene -> overlay a gradient map with `globalCompositeOperation = 'soft-light'` or `'overlay'` (shadow tint bottom, highlight tint top) -> apply `ctx.filter = 'contrast(1.08) saturate(1.1)'` when compositing the final buffer.

## 9. Post stack (order matters), apply every frame
1. Scene render
2. Bloom: copy bright areas, `blur(20-40px)`, add with `'lighter'` at 0.3-0.6 alpha
3. Chromatic aberration: offset R and B channels 1-3 px, scaled by camera speed (only on fast moves/impacts)
4. Color grade
5. Vignette (radial, 25-40% at corners)
6. Film grain (animated per frame, 3-6% opacity, luminance noise; seed by frame index)
7. Optional: letterbox bars, lens dirt, light leaks on transitions
8. Optional: slight sharpen at the end only for UI/text elements

## 10. Captions and text overlay (when requested)
- Word-timed highlight: the active word scales 1.08 and changes to accent color; line appears with a mask reveal.
- Keep 1-2 lines, max ~32 chars per line (9:16). Place in lower-middle (y ~ 1350-1500), away from platform UI. Drop shadow + 6-10 px outline for legibility.
- Arabic: animate by word, RTL, no letter-spacing, check joining after any transform.

## 11. Common amateur tells to avoid
Mismatched easing between layers · text arriving after the voice says it · uniform particle size · constant camera speed · no grain on gradients (banding!) · pure black backgrounds with no vignette · glow without a source · inconsistent light direction between objects and shadows.
