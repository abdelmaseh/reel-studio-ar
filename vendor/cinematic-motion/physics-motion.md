# Physics-Based Motion Reference

Contents: scale · gravity & falling · bounce · springs · drag · collisions · rotation · squash/stretch · cloth/rope/hair feel · weight table · timing cheatsheet

## 1. Scale first (this is what makes it "real")
Pick a pixels-per-meter scale and state it in code: `const PPM = ...`.
- Object you want to read as a **basketball (0.24 m)** that is 240 px wide -> `PPM = 1000`. Then `g = 9.81 * 1000 = 9810 px/s^2`. A 1.5 m drop takes `sqrt(2*1.5/9.81) = 0.55 s`.
- Big heavy thing (wrecking ball 1.5 m, 360 px) -> `PPM = 240`, `g = 2354 px/s^2`. Falls slower on screen, feels massive.
- **Rule of thumb**: smaller apparent object = larger PPM = faster fall. Wrong scale is why CG looks "floaty". For miniature/macro feel, use slow-motion (time scale 0.25-0.5) instead of changing g.
- Fall time `t = sqrt(2h/g)`, impact speed `v = sqrt(2gh)`. Use `v` to drive shake, dust amount, sound loudness, squash amount.

## 2. Falling
Analytic constant acceleration: `y(t) = y0 + v0*t + 0.5*g*t^2` (y down). Never use `easeIn` for a fall. Add:
- **Air drag** for light things (paper, feathers, petals, confetti): terminal velocity `vt = sqrt(2m g / (rho Cd A))`; practical: linear drag `k` in 0.5-3 s^-1. Flutter: add sinusoidal sway `x += A*sin(w*t + phase)` with amplitude decaying as speed rises.
- **Spin**: tumbling objects rotate at nearly constant angular velocity with slight random variation; conserve it until impact.
- **Anticipation**: if released by something, 3-6 frames of hesitation or a tiny upward bob (cartoon-real) before the drop; for realistic, a clean release is fine.
- **Stretch** along velocity: `stretch = 1 + clamp(speed/maxSpeed,0,1)*0.25`.

## 3. Bounce
Each impact: `v_out = -e * v_in` (e = restitution). Bounce height ratio = `e^2`. Time between bounces shrinks by factor `e`. Stop when `|v| < v_min` (about 0.3-0.5 m/s) and let it "settle" with micro-jitter then rest. Use `M.bounceTrack` (analytic) or `M.World` (simulated).
| Material | e | Notes |
|---|---|---|
| Steel/stone | 0.15-0.3 | 1-2 bounces, heavy dust, shake |
| Glass | 0.2 | shatter above a speed threshold |
| Wood | 0.3-0.45 | hollow knock |
| Basketball | 0.75 | many bounces, squash visible |
| Rubber ball | 0.85 | very lively |
| Water balloon | 0 | splat, deform, spray |
| Sand/soft | 0.05 | sink + dust |
Friction on impact: horizontal velocity reduces `vx *= (1 - mu*0.3)`; spinning objects convert spin to roll. Rolling: `omega = vx / radius` (this alone fixes "sliding" look).

## 4. Springs (UI pops, overshoot, follow-through)
Closed-form damped spring (`M.spring`): stiffness `k`, damping `c`, mass `m`.
- Snappy UI: `k=300, c=24, m=1` (slight overshoot)
- Bouncy pop: `k=180, c=12`
- Heavy/smooth: `k=80, c=18`, or critically damped `c = 2*sqrt(k*m)` (no overshoot, premium feel)
- Drive **scale, position, rotation, opacity** with springs from time of trigger `t - t0`.
Follow-through: child elements use the same spring delayed by 2-5 frames and lower stiffness (hair, antennas, tails, text lines).

## 5. Drag, wind, buoyancy
- Linear drag: `v *= exp(-k dt)`. Underwater: k = 4-8. Air light: 0.3-1. Space: 0.
- Wind: add noise-based force `fx = windStrength * fbm(t*0.5 + y*0.01)`.
- Floating/buoyancy: `y += A*sin(w t)` with A small (3-8 px at 1080 wide), plus tiny rotation lag.

## 6. Collisions (stack, domino, ball-vs-wall)
Use `M.World` (fixed-step 240 Hz, deterministic, cached so `renderFrame(t)` can scrub):
- Circle-circle impulse with restitution, circle-floor, circle-wall.
- Substeps prevent tunneling; never use render dt.
- For large objects hitting something: **hit-stop** (freeze 2-4 frames at 60fps = 33-66 ms) + camera shake + flash + particles. Hit-stop is the biggest "impact feel" trick in film and games.
- Chain reactions: trigger delay = distance / propagation speed, not equal intervals.
- Destruction (wall of bricks): pre-fracture into pieces, give each initial velocity = `impactDir * (impulse / (1 + dist*0.02))` + random spin; pieces under `World` with e=0.2-0.3. Dust cloud expands from the impact point, lingers 1-2 s.

## 7. Rotation and inertia
- Angular velocity persists; torque from off-center hits: `omega += (r x J)/I`.
- Pendulum (wrecking ball): `theta'' = -(g/L) sin(theta)`, integrate; period `T = 2*pi*sqrt(L/g)`; speed peaks at the bottom, slows at the top, nearly hangs at apex. This is why a swing looks real and a sine-eased swing looks fake (small angles are ~sine, big swings are not).
- Camera and hero both get tiny roll (0.2-1.5 deg) on impacts, decaying in ~0.4 s (`M.shake`).

## 8. Squash and stretch recipe
```
stretch (in flight):  sy = 1 + 0.25*s,  sx = 1/sqrt(sy)   // s = speed/maxSpeed, along velocity axis
squash (impact 2-4 frames): sy = 1 - 0.35*s, sx = 1/sqrt(sy)  // anchored at contact point, not center
recover: spring back with overshoot (k=250, c=14)
```
Anchor the scale at the contact point (bottom) so the object doesn't sink into the floor. For rigid metal, use 0.03-0.08 instead of 0.35 and rely on shake/dust.

## 9. Cloth, rope, ribbons, hair (cheap and convincing)
- Chain of N points, each follows the previous with a lag (verlet, 8-20 constraint iterations), gravity on every point. Render as smooth quadratic curve with tapering width.
- Cloth feel for flags/banners: 2D sine travelling wave `y += A(x)*sin(kx - wt)` with `A` growing toward the free edge, shading by wave slope.

## 10. Weight vs timing cheat sheet (at 60fps)
| Feeling | Ease in (frames) | Peak speed | Settle | Extras |
|---|---|---|---|---|
| Feather | 10-20 | very low | long, fluttering | sway, rotation, soft shadow |
| Phone/UI card | 6-10 | medium | spring 15-25 | shadow grows |
| Person-size object | 12-18 | medium | 20-30 | slight shake |
| Anvil/steel ball | 20-30 (slow start) | very high | almost none | hit-stop, big shake, dust, crack |
| Explosion | 0-2 | instant | 60+ decay | flash, shockwave ring, debris |

## 11. Determinism checklist
- Seeded RNG per object (`M.rng(seed)`), never `Math.random`.
- Fixed physics step, cached snapshots, query by `t`.
- No dependency on previous rendered frame state except through the cached sim.

## 12. Verification
Frame-step through: (1) the first frames of the fall must show small displacement then increasing (1:3:5:7 ratio of per-frame travel), (2) each bounce peak is `e^2` of the previous, (3) shadow scale/opacity follows height, (4) squash lasts 2-4 frames, (5) nothing penetrates the floor.
