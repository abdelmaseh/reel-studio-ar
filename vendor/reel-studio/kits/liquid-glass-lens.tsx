// Extracted from reel-studio `engine/src/styles/liquid-glass/designs/kit.tsx`
// (Apache-2.0, https://github.com/mohamedabdou-ai/reel-studio). Only the lens machinery that
// the lens-zoom transition needs: tokens, LensState, LensDisc, LensBezel and the suppression context.
// The original's typography hooks (DesignText / MONO font) are replaced with plain text + monospace.
import React from 'react';
import {useCurrentFrame} from 'remotion';

export const COLOR = {ink: '#050916', cyan: '#64E4FF', violet: '#7B5CFF', mint: '#86E8BC', rose: '#FF8DAB', white: '#FFFFFF', teal: '#12C4DC', blue: '#3563FF'};
export const C = COLOR;
export const W = 1080, H = 1920;

export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const RIM_MASK: React.CSSProperties = {
  WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', WebkitMaskComposite: 'xor',
  mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)', maskComposite: 'exclude',
} as React.CSSProperties;

// ---------- the lens ----------
export type LensState = {cx: number; cy: number; r: number; zoom: number; blur: number; vis: number; spin: number; label?: string; tag?: boolean};

/** The glass disc: scene layers re-rendered scaled about the lens centre and clipped to a circle, plus rim, refraction and highlights. */
export const LensDisc: React.FC<{cx: number; cy: number; R: number; layers: {node: React.ReactNode; zoom: number; blur?: number; opacity?: number}[]; rim?: number}> = ({cx, cy, R, layers, rim = 1}) =>
  <>
    <div style={{position: 'absolute', left: cx - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: '50%', opacity: rim,
      boxShadow: '0 36px 80px rgba(0,0,0,0.55), 0 0 90px rgba(100,228,255,0.2)'}}/>
    {/* clip-path makes this its own backdrop root, so glass inside the copy blurs only the magnified copy */}
    <div style={{position: 'absolute', left: cx - R, top: cy - R, width: R * 2, height: R * 2, clipPath: `circle(${R}px at 50% 50%)`, isolation: 'isolate'}}>
      {layers.map((l, i) => <div key={i} style={{position: 'absolute', left: -(cx - R), top: -(cy - R), width: W, height: H, transform: `scale(${l.zoom})`,
        transformOrigin: `${cx}px ${cy}px`, opacity: l.opacity ?? 1, filter: l.blur && l.blur > 0.3 ? `blur(${l.blur}px)` : undefined}}>{l.node}</div>)}
      <div style={{position: 'absolute', inset: 0, opacity: rim, background: `radial-gradient(circle closest-side, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%, ${rgba(C.cyan, 0.12)} 82%, ${rgba(C.violet, 0.34)} 100%)`}}/>
      <div style={{position: 'absolute', inset: 0, opacity: rim, background: 'radial-gradient(circle at 74% 84%, rgba(18,196,220,0.28), rgba(18,196,220,0) 34%)'}}/>
      <div style={{position: 'absolute', left: '8%', top: '5%', width: '62%', height: '40%', borderRadius: '50%', opacity: rim * 0.9, transform: 'rotate(-24deg)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.02) 85%)'}}/>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', padding: Math.max(3, R * 0.022), boxSizing: 'border-box', opacity: rim, ...RIM_MASK,
        background: `linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.22) 52%, ${rgba(C.cyan, 0.8)})`}}/>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', opacity: rim, boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.3), inset 0 0 46px ${rgba(C.cyan, 0.3)}`}}/>
    </div>
  </>;

/** Bezel ticks and a cyan scan arc that sweeps while the lens travels, plus the magnification chip. */
export const LensBezel: React.FC<{cx: number; cy: number; R: number; spin: number; zoom: number; vis: number; tag?: boolean}> = ({cx, cy, R, spin, zoom, vis, tag}) => {
  const f = useCurrentFrame();
  const pad = 46, S = (R + pad) * 2, c = R + pad;
  const ticks = Array.from({length: 72}, (_, i) => i);
  const arcA = -60 + spin * 150 + f * 0.25, arcLen = 70;
  const pt = (deg: number, rad: number) => [c + Math.cos(deg * Math.PI / 180) * rad, c + Math.sin(deg * Math.PI / 180) * rad];
  const [ax, ay] = pt(arcA, R + 22), [bx, by] = pt(arcA + arcLen, R + 22);
  const chipA = -46, [chx, chy] = pt(chipA, R + 26);
  const label = `${zoom.toFixed(1)}×`;
  return <div style={{position: 'absolute', left: cx - c, top: cy - c, width: S, height: S, opacity: vis}}>
    <svg width={S} height={S} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      {ticks.map((i) => { const deg = i * 5 + f * 0.2, major = i % 6 === 0; const [x1, y1] = pt(deg, R + 12), [x2, y2] = pt(deg, R + (major ? 28 : 20));
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeOpacity={major ? 0.55 : 0.26} strokeWidth={major ? 2.4 : 1.6} strokeLinecap="round"/>; })}
      <path d={`M${ax} ${ay} A${R + 22} ${R + 22} 0 0 1 ${bx} ${by}`} fill="none" stroke={C.cyan} strokeWidth="5" strokeLinecap="round" style={{filter: `drop-shadow(0 0 8px ${rgba(C.cyan, 0.9)})`}}/>
    </svg>
    {tag ? <div style={{position: 'absolute', left: chx - 50, top: chy - 22, width: 100, height: 44, borderRadius: 22, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      background: 'rgba(5,9,22,0.5)', boxShadow: `inset 0 0 0 1.5px ${rgba(C.cyan, 0.7)}`, color: C.cyan, fontFamily: 'monospace', fontWeight: 600, fontSize: 24, letterSpacing: 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr'}}>{label}</div> : null}
  </div>;
};

const LensVisibleCtx = React.createContext(true);
export const GlassLensSuppression: React.FC<{children?: React.ReactNode}> = ({children}) => <LensVisibleCtx.Provider value={false}>{children}</LensVisibleCtx.Provider>;
/** False inside GlassLensSuppression, so a design's own lens hides together with the style's lenses. */
export const useLensVisible = (): boolean => React.useContext(LensVisibleCtx);
