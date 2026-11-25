/* motionlib.js - deterministic motion toolkit (global `M`)
 * Everything is a pure function of time. No Math.random, no wall-clock.
 * Coordinates: y grows DOWN (canvas). Units: pixels and seconds.
 */
(function (root) {
  const M = {};
  const PI = Math.PI;

  /* ---------- basic math ---------- */
  M.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  M.lerp = (a, b, t) => a + (b - a) * t;
  M.invLerp = (a, b, x) => (x - a) / (b - a);
  M.remap = (x, a, b, c, d, clamp = true) => {
    let t = (x - a) / (b - a);
    if (clamp) t = M.clamp(t);
    return c + (d - c) * t;
  };
  M.smoothstep = (a, b, x) => { const t = M.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  M.smootherstep = (a, b, x) => { const t = M.clamp((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };

  /* ---------- easing (t in 0..1) ---------- */
  const E = {
    linear: t => t,
    inQuad: t => t * t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    inOutQuad: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: t => t * t * t,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: t => 1 - Math.pow(1 - t, 4),
    outQuint: t => 1 - Math.pow(1 - t, 5),
    inExpo: t => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: t => (t === 0 ? 0 : t === 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    inSine: t => 1 - Math.cos((t * PI) / 2),
    outSine: t => Math.sin((t * PI) / 2),
    inOutSine: t => -(Math.cos(PI * t) - 1) / 2,
    outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
    outElastic: t => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * PI) / 3)) + 1),
  };
  M.ease = E;
  /** cubic-bezier like CSS: M.bezier(0.2,0.8,0.2,1)(t) */
  M.bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = s => ((ax * s + bx) * s + cx) * s;
    const Y = s => ((ay * s + by) * s + cy) * s;
    const dX = s => (3 * ax * s + 2 * bx) * s + cx;
    return t => {
      t = M.clamp(t); let s = t;
      for (let i = 0; i < 8; i++) { const d = dX(s); if (Math.abs(d) < 1e-6) break; s -= (X(s) - t) / d; }
      return Y(M.clamp(s));
    };
  };
  /** tween helper: M.tween(t, t0, dur, from, to, easeFn) */
  M.tween = (t, t0, dur, a, b, ease = E.outCubic) => M.lerp(a, b, ease(M.clamp((t - t0) / dur)));

  /* ---------- seeded random + noise ---------- */
  M.rng = (seed = 1) => { // mulberry32
    let a = seed >>> 0;
    const f = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    f.range = (a, b) => a + (b - a) * f();
    f.sign = () => (f() < .5 ? -1 : 1);
    f.pick = arr => arr[Math.floor(f() * arr.length)];
    return f;
  };
  const hash = (i, seed) => { let h = (i * 374761393 + seed * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; h ^= h >>> 16; return ((h >>> 0) / 4294967296) * 2 - 1; };
  /** smooth 1D value noise in -1..1 */
  M.noise = (x, seed = 0) => { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return M.lerp(hash(i, seed), hash(i + 1, seed), u); };
  /** fractal noise (organic motion): 3 octaves */
  M.fbm = (x, seed = 0) => M.noise(x, seed) * 0.57 + M.noise(x * 2.03, seed + 7) * 0.29 + M.noise(x * 4.1, seed + 13) * 0.14;

  /* ---------- damped spring (closed form) ----------
   * returns position at time t (t>=0) moving from `from` to `to` with initial velocity v0 */
  M.spring = (t, o = {}) => {
    const k = o.stiffness ?? 220, c = o.damping ?? 18, m = o.mass ?? 1;
    const from = o.from ?? 0, to = o.to ?? 1, v0 = o.v0 ?? 0;
    if (t <= 0) return from;
    const x0 = from - to, w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
    let x;
    if (z < 1) {
      const wd = w0 * Math.sqrt(1 - z * z);
      x = Math.exp(-z * w0 * t) * (x0 * Math.cos(wd * t) + ((v0 + z * w0 * x0) / wd) * Math.sin(wd * t));
    } else if (z === 1) {
      x = Math.exp(-w0 * t) * (x0 + (v0 + w0 * x0) * t);
    } else {
      const s = Math.sqrt(z * z - 1), r1 = -w0 * (z - s), r2 = -w0 * (z + s);
      const B = (v0 - r1 * x0) / (r2 - r1), A = x0 - B;
      x = A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
    }
    return to + x;
  };
  M.springPresets = {
    snappy: { stiffness: 300, damping: 24 },
    bouncy: { stiffness: 180, damping: 12 },
    smooth: { stiffness: 80, damping: 18 },
    heavy: { stiffness: 60, damping: 16, mass: 1.6 },
  };

  /* ---------- gravity: analytic drop + bounce ----------
   * h0: start height above floor (px), v0: initial upward speed (px/s, + = up)
   * g: px/s^2 (e.g. 9.81*PPM), e: restitution, vMin: stop threshold px/s
   * returns {h, v, n, impacts:[{t,speed}], resting}  (h = height above floor, v = upward velocity) */
  M.bounceTrack = (t, o) => {
    const g = o.g, e = o.e ?? 0.5, vMin = o.vMin ?? g * 0.05;
    let h = o.h0 ?? 0, v = o.v0 ?? 0, clock = 0, n = 0;
    const impacts = [];
    for (let guard = 0; guard < 60; guard++) {
      const disc = v * v + 2 * g * h;
      const tHit = (v + Math.sqrt(Math.max(0, disc))) / g; // time until h reaches 0
      if (t - clock <= tHit) {
        const tau = t - clock;
        return { h: Math.max(0, h + v * tau - 0.5 * g * tau * tau), v: v - g * tau, n, impacts, resting: false };
      }
      const speed = Math.abs(v - g * tHit);
      clock += tHit; impacts.push({ t: clock, speed });
      v = speed * e; h = 0; n++;
      if (v < vMin) return { h: 0, v: 0, n, impacts, resting: true };
    }
    return { h: 0, v: 0, n, impacts, resting: true };
  };
  /** time until first impact and impact speed for a drop */
  M.dropInfo = (h, g, v0 = 0) => { const tHit = (v0 + Math.sqrt(v0 * v0 + 2 * g * h)) / g; return { tHit, speed: Math.abs(v0 - g * tHit) }; };
  /** convenience: all impact times of a bounce sequence (for audio/FX sync) */
  M.impactTimes = (o, t0 = 0) => M.bounceTrack(1e6, o).impacts.map(i => ({ t: t0 + i.t, speed: i.speed }));

  /* ---------- squash & stretch (volume preserving) ---------- */
  M.stretch = (speed, maxSpeed, amount = 0.25) => { const s = M.clamp(speed / maxSpeed); const sy = 1 + amount * s; return { sx: 1 / Math.sqrt(sy), sy }; };
  /** impact squash: tSinceImpact seconds, strength 0..1, returns {sx,sy} (apply anchored at the contact point) */
  M.squash = (tSince, strength = 0.5, dur = 0.12) => {
    if (tSince < 0) return { sx: 1, sy: 1 };
    const d = M.spring(tSince, { from: 1 - 0.35 * strength, to: 1, stiffness: 300, damping: 15 });
    return { sx: 1 / Math.sqrt(d), sy: d };
  };

  /* ---------- pendulum (real, non-small-angle) ----------
   * returns angle(t) in radians from vertical, integrating theta''=-(g/L) sin(theta) at 1kHz, cached */
  M.pendulum = (() => {
    const cache = new Map();
    return (t, { theta0 = 1.0, L = 600, g = 9810, damping = 0 }) => {
      const key = `${theta0}|${L}|${g}|${damping}`;
      let c = cache.get(key);
      if (!c) { c = { th: theta0, w: 0, i: 0, arr: [theta0] }; cache.set(key, c); }
      const dt = 0.001, steps = Math.floor(t / dt);
      while (c.i < steps) {
        const a = -(g / L) * Math.sin(c.th) - damping * c.w;
        c.w += a * dt; c.th += c.w * dt; c.i++; c.arr.push(c.th);
      }
      return c.arr[Math.max(0, Math.min(steps, c.arr.length - 1))];
    };
  })();

  /* ---------- camera shake / handheld ---------- */
  /** impact shake: decaying, returns {x,y,rot}. t since impact, amp px */
  M.shake = (tSince, amp = 20, freq = 9, decay = 7, seed = 1) => {
    if (tSince < 0) return { x: 0, y: 0, rot: 0 };
    const env = Math.exp(-decay * tSince);
    return {
      x: amp * env * M.noise(tSince * freq, seed),
      y: amp * env * M.noise(tSince * freq, seed + 11),
      rot: (amp / 25) * (PI / 180) * env * M.noise(tSince * freq, seed + 23),
    };
  };
  /** continuous handheld feel */
  M.handheld = (t, amp = 3, speed = 1, seed = 5) => ({
    x: amp * M.fbm(t * speed, seed), y: amp * M.fbm(t * speed, seed + 31),
    rot: (amp / 20) * (PI / 180) * M.fbm(t * speed * 0.8, seed + 57),
  });
  /** sum shakes for several impacts: M.shakeAll(t, [{t:1.2,amp:30},...]) */
  M.shakeAll = (t, list) => list.reduce((a, h) => { const s = M.shake(t - h.t, h.amp, h.freq, h.decay, h.seed ?? 1); return { x: a.x + s.x, y: a.y + s.y, rot: a.rot + s.rot }; }, { x: 0, y: 0, rot: 0 });

  /* ---------- time remap (slow motion with smooth ramps) ----------
   * segments: [{t0, t1, scale, ramp}] ; returns scene-time. Integrates numerically (cached). */
  M.timeMap = (segments, dur, fps = 240) => {
    const n = Math.ceil(dur * fps) + 1, tab = new Float64Array(n); let acc = 0;
    const scaleAt = t => { let s = 1; for (const g of segments) { const r = g.ramp ?? 0.2; const a = M.smoothstep(g.t0 - r, g.t0, t) * (1 - M.smoothstep(g.t1, g.t1 + r, t)); s = s * (1 - a) + g.scale * a; } return s; };
    for (let i = 0; i < n; i++) { tab[i] = acc; acc += scaleAt(i / fps) / fps; }
    return t => { const f = M.clamp(t * fps, 0, n - 1), i = Math.floor(f); return M.lerp(tab[i], tab[Math.min(i + 1, n - 1)], f - i); };
  };

  /* ---------- analytic particles (drag + gravity) ---------- */
  /** create a burst: M.burst(seed, n, {x,y,speed:[a,b],angle:[a0,a1],life:[a,b],size:[a,b],drag,gravity,spin,t0}) */
  M.burst = (seed, n, o = {}) => {
    const r = M.rng(seed), out = [];
    const sp = o.speed ?? [200, 800], an = o.angle ?? [0, 2 * PI], lf = o.life ?? [0.6, 1.4], sz = o.size ?? [2, 6];
    for (let i = 0; i < n; i++) {
      const a = r.range(an[0], an[1]), s = r.range(sp[0], sp[1]) * (0.35 + 0.65 * r()); // power-ish distribution
      out.push({ x: o.x ?? 0, y: o.y ?? 0, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: r.range(lf[0], lf[1]), size: r.range(sz[0], sz[1]) * (r() < 0.15 ? 1.8 : 1),
        k: (o.drag ?? 2) * r.range(0.8, 1.2), g: o.gravity ?? 0, rot: r.range(0, 2 * PI), spin: (o.spin ?? 6) * r.range(-1, 1), t0: o.t0 ?? 0, seed: r.range(0, 1000), hue: r() });
    }
    return out;
  };
  /** state of one particle at global time t -> {x,y,vx,vy,age,u,alpha,size,rot} or null if dead/unborn */
  M.particleAt = (p, t) => {
    const age = t - p.t0; if (age < 0 || age > p.life) return null;
    const k = Math.max(p.k, 1e-4), e = Math.exp(-k * age), u = age / p.life;
    const x = p.x + (p.vx * (1 - e)) / k;
    const y = p.y + ((p.vy + p.g / k) * (1 - e)) / k - (p.g * age) / k;
    const vx = p.vx * e, vy = (p.vy + p.g / k) * e - p.g / k;
    return { x, y, vx, vy, age, u, alpha: Math.pow(1 - u, 1.5), size: p.size * (1 - 0.5 * u), rot: p.rot + p.spin * age };
  };
  /** draw spark streaks (additive) */
  M.drawSparks = (ctx, parts, t, color = '255,190,90', blurLen = 0.018) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const p of parts) { const s = M.particleAt(p, t); if (!s) continue;
      ctx.strokeStyle = `rgba(${color},${s.alpha})`; ctx.lineWidth = Math.max(1, s.size * 0.6);
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * blurLen, s.y - s.vy * blurLen); ctx.stroke(); }
    ctx.restore();
  };
  /** draw soft puffs (dust/smoke), uses a cached radial sprite */
  const spriteCache = {};
  const puffSprite = (rgb) => spriteCache[rgb] || (spriteCache[rgb] = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, `rgba(${rgb},0.55)`); gr.addColorStop(0.5, `rgba(${rgb},0.25)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; })());
  M.drawPuffs = (ctx, parts, t, rgb = '190,180,165', grow = 2.2) => {
    ctx.save();
    for (const p of parts) { const s = M.particleAt(p, t); if (!s) continue;
      const sz = p.size * (1 + (grow - 1) * Math.sqrt(s.u)); ctx.globalAlpha = s.alpha * 0.8;
      ctx.drawImage(puffSprite(rgb), s.x - sz, s.y - sz - 12 * s.age * (p.g < 0 ? 1 : 0), sz * 2, sz * 2); }
    ctx.restore();
  };

  /* ---------- rigid-body-lite world (deterministic, scrubbable) ---------- */
  M.World = class {
    constructor(o = {}) {
      this.g = o.g ?? 9810; this.floor = o.floor ?? 1700; this.left = o.left ?? -1e9; this.right = o.right ?? 1e9;
      this.e = o.e ?? 0.4; this.mu = o.mu ?? 0.5; this.hz = o.hz ?? 240; this.drag = o.drag ?? 0.05;
      this.bodies = []; this.snaps = []; this.step_i = 0; this.events = [];
    }
    /** add circle body: {x,y,r,vx,vy,w(angular),m,e,spawn(t)} */
    add(b) { b.m = b.m ?? (b.r * b.r); b.rot = b.rot ?? 0; b.w = b.w ?? 0; b.vx = b.vx ?? 0; b.vy = b.vy ?? 0; b.spawn = b.spawn ?? 0; b.e = b.e ?? this.e; this.bodies.push(b); return b; }
    _init() { if (!this.snaps.length) this.snaps.push(this.bodies.map(b => ({ x: b.x, y: b.y, vx: b.vx, vy: b.vy, rot: b.rot, w: b.w }))); }
    _step(dt, time) {
      const B = this.bodies, S = this.snaps[this.snaps.length - 1].map(s => ({ ...s }));
      for (let i = 0; i < B.length; i++) { const b = B[i], s = S[i]; if (time < b.spawn) continue;
        s.vy += this.g * dt; const d = Math.exp(-this.drag * dt); s.vx *= d; s.vy *= d; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.w * dt;
        if (s.y + b.r > this.floor) { const sp = s.vy; s.y = this.floor - b.r; if (sp > 60) { s.vy = -sp * b.e; this.events.push({ t: time, i, speed: sp, type: 'floor' }); } else s.vy = 0;
          s.vx *= (1 - this.mu * 0.02); s.w = s.vx / b.r; }  // rolling: omega = v/r
        if (s.x - b.r < this.left) { s.x = this.left + b.r; s.vx = -s.vx * b.e; }
        if (s.x + b.r > this.right) { s.x = this.right - b.r; s.vx = -s.vx * b.e; } }
      for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) { // circle-circle impulse
        const a = B[i], c = B[j], sa = S[i], sc = S[j]; if (time < a.spawn || time < c.spawn) continue;
        const dx = sc.x - sa.x, dy = sc.y - sa.y, dist = Math.hypot(dx, dy), min = a.r + c.r; if (dist >= min || dist === 0) continue;
        const nx = dx / dist, ny = dy / dist, over = min - dist, tm = a.m + c.m;
        sa.x -= nx * over * (c.m / tm); sa.y -= ny * over * (c.m / tm); sc.x += nx * over * (a.m / tm); sc.y += ny * over * (a.m / tm);
        const rv = (sc.vx - sa.vx) * nx + (sc.vy - sa.vy) * ny; if (rv > 0) continue;
        const e = Math.min(a.e, c.e), jn = -(1 + e) * rv / (1 / a.m + 1 / c.m);
        sa.vx -= (jn * nx) / a.m; sa.vy -= (jn * ny) / a.m; sc.vx += (jn * nx) / c.m; sc.vy += (jn * ny) / c.m;
        if (-rv > 80) this.events.push({ t: time, i, j, speed: -rv, type: 'body' }); }
      this.snaps.push(S);
    }
    /** state at time t: returns array aligned with bodies [{x,y,rot,vx,vy}] */
    at(t) {
      this._init(); const dt = 1 / this.hz, need = Math.floor(t * this.hz);
      while (this.snaps.length - 1 < need) this._step(dt, this.snaps.length * dt);
      const f = t * this.hz - need, a = this.snaps[Math.min(need, this.snaps.length - 1)], b = this.snaps[Math.min(need + 1, this.snaps.length - 1)];
      return a.map((s, i) => ({ x: M.lerp(s.x, b[i].x, f), y: M.lerp(s.y, b[i].y, f), rot: M.lerp(s.rot, b[i].rot, f), vx: s.vx, vy: s.vy }));
    }
  };

  /* ---------- rendering helpers (Canvas 2D) ---------- */
  /** contact shadow: height above surface (px) -> soft ellipse on the floor */
  M.contactShadow = (ctx, x, floorY, width, height, maxH = 600, opacity = 0.55) => {
    const k = M.clamp(height / maxH), w = width * (1 + 0.8 * k), a = opacity * (1 - 0.8 * k);
    ctx.save(); ctx.translate(x, floorY); ctx.scale(1, 0.18);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.45})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, w / 2, 0, 2 * PI); ctx.fill(); ctx.restore();
  };
  M.glow = (ctx, x, y, R, rgb = '120,200,255', core = 0.9) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(255,255,255,${core})`); g.addColorStop(0.12, `rgba(${rgb},0.6)`); g.addColorStop(0.45, `rgba(${rgb},0.15)`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2); ctx.restore();
  };
  M.shockwave = (ctx, x, y, tSince, { maxR = 700, dur = 0.55, rgb = '255,255,255', width = 40 } = {}) => {
    if (tSince < 0 || tSince > dur) return; const u = tSince / dur, R = maxR * E.outExpo(u), a = Math.pow(1 - u, 1.6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rgb},${a * 0.8})`; ctx.lineWidth = width * (1 - u) + 1;
    ctx.beginPath(); ctx.arc(x, y, R, 0, 2 * PI); ctx.stroke(); ctx.restore();
  };
  M.vignette = (ctx, w, h, strength = 0.45) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.55);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  };
  let grainTile = null;
  M.grain = (ctx, w, h, frame, amount = 0.05) => {
    if (!grainTile) { grainTile = []; for (let k = 0; k < 6; k++) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), id = g.createImageData(256, 256), r = M.rng(900 + k);
      for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); grainTile.push(c); } }
    const tile = grainTile[frame % 6], r = M.rng(frame * 7 + 1), ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
    ctx.save(); ctx.globalAlpha = amount; ctx.globalCompositeOperation = 'overlay';
    for (let x = -ox; x < w; x += 256) for (let y = -oy; y < h; y += 256) ctx.drawImage(tile, x, y);
    ctx.restore();
  };
  /** color grade via two soft-light gradients: shadowRGB at bottom, highlightRGB at top */
  M.grade = (ctx, w, h, shadow = '10,60,80', highlight = '255,170,90', amt = 0.35) => {
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${highlight},${amt})`); g.addColorStop(1, `rgba(${shadow},${amt})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
  };
  M.flash = (ctx, w, h, tSince, dur = 0.12, peak = 0.7) => { if (tSince < 0 || tSince > dur) return; ctx.save(); ctx.globalAlpha = peak * (1 - tSince / dur); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.restore(); };
  /** apply camera transform; call ctx.save() before and ctx.restore() after drawing the world */
  M.camera = (ctx, w, h, c) => { ctx.translate(w / 2, h / 2); ctx.rotate(c.rot || 0); ctx.scale(c.zoom || 1, c.zoom || 1); ctx.translate(-w / 2 - (c.x || 0), -h / 2 - (c.y || 0)); };

  root.M = M;
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
