# Fantasy and VFX Reference

Contents: principles · particles · glow and light · energy/magic · smoke, dust, fire · shockwave and impact · glass, liquid, metal · 3D-look in 2D · levitation and impossible physics · recipes

## 1. Principles: make the impossible physical
1. Give magic **mass and consequence**: it accelerates, it has inertia, it pushes things, it lights its surroundings.
2. Every VFX has **anticipation (charge), event (burst), aftermath (embers, smoke, settling)**. Most amateur FX only has the burst.
3. **Emissive things emit light**: surfaces near them get tinted; the background brightens slightly; a soft halo and a small lens flare sit on the core.
4. Size variety: particles follow a power-law distribution (many tiny, few large). Opacity, speed and lifetime all vary +/-40%.
5. Layer 3 scales of effect: macro (shockwave, big glow), meso (sparks, debris), micro (dust motes, grain).
6. Color: core = near-white, mid = saturated hue, edge = deeper hue with lower alpha. Use additive blending for light, normal for smoke/dust.

## 2. Particles (deterministic)
Use `M.burst(seed, n, opts)` and `M.particleAt(p, t)` (analytic, drag + gravity, no state). Typical settings:
| Effect | n | speed (px/s) | drag k | gravity | life (s) | size (px) |
|---|---|---|---|---|---|---|
| Sparks | 40-120 | 600-1800 | 2-4 | 1.0 g | 0.4-1.1 | 2-5, stretch along velocity |
| Debris chunks | 15-40 | 300-1100 | 0.3 | 1.0 g | 1.5-3 | 6-28, rotating |
| Dust puff | 20-60 | 80-350 | 3-5 | -0.05 g | 1.2-2.5 | 40-160, grows, fades |
| Embers (rising) | 30-80 | 20-120 | 1 | -0.15 g | 2-4 | 2-6, flicker |
| Magic motes | 60-200 | 10-60 | 0.5 | 0 | 2-5 | 1-4, noise drift |
| Confetti/petals | 80-200 | 300-900 | 1.5-3 | 0.3 g | 2-5 | 8-18, tumble + sway |
Render sparks as short motion-blur streaks (line from `pos` to `pos - vel*0.016`), not dots.
Fade: `alpha = (1 - age/life)^1.5`; shrink: `size *= 1 - 0.5*age/life`.

## 3. Glow and light (canvas recipe)
```
// soft glow around a point
const g = ctx.createRadialGradient(x,y,0,x,y,R);
g.addColorStop(0,'rgba(255,255,255,0.95)');
g.addColorStop(0.15,'rgba(120,200,255,0.55)');
g.addColorStop(1,'rgba(20,60,255,0)');
ctx.globalCompositeOperation='lighter'; ctx.fillStyle=g; ctx.fillRect(x-R,y-R,2*R,2*R);
```
- Add **light wrap**: tint nearby objects with the glow color (screen/overlay a low-alpha radial gradient over them).
- **God rays**: draw 12-30 thin triangles/gradients from the source, rotate slowly, animate alpha with noise, `lighter`.
- **Lens flare**: ring + 3-5 small circles along the line to the screen center, low alpha, ghosting color shift.
- Flicker: `intensity *= 1 + 0.08*fbm(t*12)`.

## 4. Energy and magic
- **Orb/projectile**: bright core + 2 glow layers + trailing particles + a ribbon trail (last N positions, width tapering, alpha fading). Trail positions sampled from the true past path (`pos(t - i*dt)`), not smoothed guesses.
- **Lightning**: recursive midpoint displacement (seeded), 2-3 jittering layers, re-seed every 2-3 frames at 60fps for flicker, white core + blue/violet glow, branch at 20-30% probability.
- **Force field/shield**: hex or ring pattern with fresnel-like edge brightness, ripples from the hit point (`sin(k*d - w*t) * exp(-d/L - t/T)`).
- **Portal/vortex**: spiral of particles, angular speed increases toward the center (`omega ~ 1/r`), depth blur, inner glow, light spill on surroundings.
- **Charging**: particles accelerate *toward* the source (inverse of burst), glow grows, camera slow push-in, sound riser. Release after a 2-3 frame black/white flash.
- **Rune/line draw-on**: animate `lineDashOffset` with ease, add a bright head and a fading tail.

## 5. Smoke, dust, fire, fog
- **Smoke/dust**: 30-80 big soft sprites (pre-render a radial gradient texture), rising with `fbm` turbulence, grow 1.0 -> 2.5x, fade out; normal blending, grey-brown or tinted by scene light.
- **Fire**: additive, layered flames: base yellow-white, mid orange, edge red; upward noise-driven wobble; sparks and embers; strong flicker on nearby lighting.
- **Volumetric fog**: 3-5 large low-alpha noise layers drifting at different speeds; darker at the bottom; light shafts cut through.

## 6. Shockwave and impact stack (use for every hit)
In this order, all within ~0.4 s of the impact frame:
1. Frame 0: **hit-stop** 2-3 frames + 1-2 frames white flash (alpha 0.35-0.8)
2. **Shockwave ring**: radius `R(t) = Rmax*outExpo(t/0.5)`, thickness shrinks, alpha fades, plus chromatic split
3. **Camera shake** + roll scaled with impact speed
4. **Debris + sparks** burst, **dust** cloud on the ground plane
5. **Crack/decal** that persists (a scorch, crack lines grown with a branching animation)
6. **Aftermath**: floating dust 1-2 s, objects settle, light fades; the world doesn't instantly return to normal.

## 7. Materials (2D tricks that read as 3D)
- **Metal**: strong environment gradient (dark/bright bands), sharp specular highlight, rim light, subtle reflection of a horizon line; animate the highlight sweeping across during rotation.
- **Glass**: thin bright edge, inner refraction offset of background (draw the background scaled 1.03 and shifted inside the shape), specular streaks, subtle tint.
- **Liquid**: metaball look: draw blurred circles, then contrast threshold (`ctx.filter = 'blur(12px) contrast(20)'` on an offscreen canvas), highlight pass on top; surface tension = merging blobs.
- **Rubber/plastic**: soft diffuse gradient + broad soft highlight + contact shadow.
- **Stone/brick**: noise-modulated fill, edge highlight on top face, darker bottom face; cracks grow on impact.
- **Paper/cloth**: gradient across the curvature, folding line shading, soft shadow offset.

## 8. 3D-look in 2D (cheap and effective)
- **2.5D parallax**: layered planes with z; project with `scale = f/(f+z)`; position `x' = cx + (x-cx)*scale - camX*(1-scale)`.
- **Perspective floor**: draw a grid or reflective floor with vanishing point; objects sit on it with shadows following the same perspective.
- **Extrusion**: duplicate a shape 8-20 times with small offsets and darkening (fake depth) for chunky 3D text/logos; add rim highlight on the front.
- **Fake rotation Y**: scale X by `cos(theta)`, swap face at 90 deg, add shading by `cos`, small perspective skew.
- **Floor reflection**: flip the object vertically below the floor line, fade with gradient, blur slightly.
- For real 3D (Three.js): use `MeshPhysicalMaterial`, an HDR-like environment (generate with `RoomEnvironment`/gradient cube), `PCFSoftShadowMap`, bloom pass, depth-of-field pass; render via `renderFrame(t)`.

## 9. Impossible physics that still feels right
- **Levitation**: object hovers with slow sine bob + tiny rotation drift + faint under-glow + particles drifting up; when released, it *starts from rest* and accelerates (gravity ramps in), not an instant drop.
- **Reverse gravity**: same equations, `g < 0`, but keep drag; debris falls upward and decelerates (like a weightless flip) before returning.
- **Slow-motion suspension**: scale time to 0.05-0.15 at the apex of a throw/explosion; particles hang, light blooms; then ramp back.
- **Shatter into floating pieces**: initial burst then drag high + gravity ~0 -> pieces drift and rotate slowly, reassemble with spring easing in reverse.
- **Size/scale illusions**: swap PPM mid-shot with a camera push for "tiny world / giant" shots, and keep dust/particle scale consistent with the new scale.

## 10. Quick recipes (assemble from the above)
- **Wrecking ball before impact**: pendulum swing + chain verlet + motion blur + warning shake; hit: hit-stop -> shockwave -> brick debris with `World` -> dust -> camera settle.
- **Steel sphere falls to a floor**: gravity drop, squash tiny, contact shadow scaling, 2 bounces (e=0.25), sparks, dust ring, slight camera shake, ring ripple on floor reflection.
- **Magic reveal of a logo/text**: charge (motes spiral in) -> flash -> text mask-reveal with a light sweep -> glow settle -> floating embers.
- **Phone/UI showcase**: 3D tilted device, slow orbit, screen glow lighting the surroundings, floating shadows, UI cards popping with springs behind it at different depths.
- **Balloon with approaching projectile (tension)**: slow push-in, shallow DoF, projectile ray of light reflections, balloon micro-oscillation (surface wobble), heartbeat-like pulse in light, silence before payoff.
