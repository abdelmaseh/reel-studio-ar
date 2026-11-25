# Quality Checklist and Delivery

Run this before delivering. Look at rendered frames, not just code.

## A. Frame inspection (extract and view)
Extract with ffmpeg: first frame, 3 frames across the hook, the frame right before impact, the impact frame, +4 frames after impact, +30 frames after, the CTA frame, the last frame.
```
ffmpeg -i final.mp4 -vf "select='eq(n,0)+eq(n,30)+eq(n,120)'" -vsync 0 chk_%02d.png
```

## B. Motion
- [ ] Falls accelerate (per-frame displacement grows ~1:3:5:7)
- [ ] Bounce heights decay by the restitution ratio; motion settles, doesn't loop forever
- [ ] Anticipation and overshoot present on hero moves; nothing stops dead
- [ ] Squash/stretch volume-preserving, anchored at contact point
- [ ] Contact shadow responds to height (size, blur, opacity)
- [ ] Fast things have motion blur (sub-frame accumulation)
- [ ] Hit-stop + shake + particles scaled by impact speed
- [ ] Easing differs by role (camera vs object vs text); no layers sharing identical timing
- [ ] No jitter: all positions are floats; no rounding; no sudden direction flips

## C. Camera and composition
- [ ] Camera never fully static >1 s
- [ ] One hero per shot, clear silhouette, thirds/lead room
- [ ] Foreground / mid / background separation with blur and parallax
- [ ] Safe area respected (9:16: top 250 px, bottom 350 px free of key info)
- [ ] Cuts happen on action (impact, whip, match cut), not on idle frames

## D. Light and grade
- [ ] Consistent light direction (shadows, highlights, rim)
- [ ] Emissive objects light their surroundings
- [ ] Palette limited and consistent; blacks lifted slightly, vignette present
- [ ] Grain on, no banding in gradients
- [ ] Bloom only on real light sources, not on everything

## E. Rhythm and sound
- [ ] Hook visible in first 1 s
- [ ] Variable shot lengths, escalating intensity, a held money shot
- [ ] Visual hits sit 0-2 frames before audio hits; `HITS` exported
- [ ] 0.2-0.4 s silence/stillness before the payoff
- [ ] Text appears on or just before the spoken word, never after

## F. Text
- [ ] Legible on the busiest frame (outline/shadow/backing)
- [ ] Arabic: real Arabic font, RTL, no letter-spacing, per-word animation
- [ ] Max two text blocks at a time; <= 6 words per beat for hero text

## G. Technical delivery
- [ ] Exact resolution and fps (check with `ffprobe`)
- [ ] Duration matches audio (+/- 1 frame)
- [ ] H.264 High profile, `yuv420p`, CRF 16-18, `-movflags +faststart`, bitrate sane (>= 12 Mbps for 1080x1920@60)
- [ ] Audio AAC 192-256 kbps, 48 kHz, no clipping (peak <= -1 dBFS)
- [ ] Files delivered: `final.mp4`, `clean.mp4` (if captions), source folder, short notes (fps, resolution, timings, editable constants)

## H. Failure fixes (fast)
| Symptom | Fix |
|---|---|
| Looks "floaty" | PPM too small -> increase `g` in px/s^2 or add drag-free fall; shorten fall time; add impact response |
| Looks "cheap" | add contact shadows, motion blur, grain, vignette, DoF; reduce simultaneous effects |
| Jittery | remove integer rounding; use sub-frame sampling; check non-deterministic randomness |
| Boring | add camera movement, vary shot length, add an anticipation beat and a payoff |
| Over-the-top | remove 30% of particles/glow; keep one hero effect |
| Text hard to read | bigger, add backing gradient, reduce bg detail behind it |
| Out of sync | shift visual hits earlier by 1-2 frames; derive timings from SRT/beat grid, not by eye |
