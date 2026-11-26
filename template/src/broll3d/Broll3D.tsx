// 3D B-roll library: premium dark-glass + gold scenes built on the depth3d kit (real CSS-3D depth, no WebGL, deterministic).
// Drop into a montage as an overlay cutaway: {at, dur, kind: 'title'|'stat'|'tunnel'|'stack', text, sub?}. Arabic-safe (no per-letter transforms).
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Stage3D, Layer, ContactShadow, Slab3D, Cube3D, Sphere3D, Ring3D, Text3D} from '../vendor/reel-studio/kits/depth3d';
import {Grain, Vignette} from '../vendor/reel-studio/core/transitions';
import {ARABIC_FONT} from '../fonts';

export type BrollKind = 'title' | 'stat' | 'tunnel' | 'stack';
export type BrollProps = {kind: BrollKind; text: string; sub?: string; items?: string[]};
export const PAL = {bg1: '#05070F', bg2: '#0E1733', gold: '#F5C451', goldDeep: '#9A6A12', teal: '#2DD4BF', tealDeep: '#0B6E66', ice: '#E8F0FF', rose: '#FF5C8A'};

const C: React.FC<{children: React.ReactNode; y?: number}> = ({children, y = 0}) => (
  <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translateY(${y}px)`, transformStyle: 'preserve-3d'}}>{children}</div>
);
const useIn = (delay = 0) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping: 14, stiffness: 110, mass: 0.9}});
};
/** floating object with contact shadow */
const Floaty: React.FC<{z: number; x: number; y: number; phase: number; amp?: number; w?: number; children: React.ReactNode}> = ({z, x, y, phase, amp = 24, w = 170, children}) => {
  const f = useCurrentFrame(); const bob = Math.sin(f / 22 + phase) * amp;
  return (<>
    <Layer z={z} x={x} y={y + 640}><div style={{position: 'absolute', left: '50%', top: '50%', transform: 'rotateX(78deg)'}}><ContactShadow width={w} height={w * 0.5} lift={bob + amp + 90} max={260} /></div></Layer>
    <Layer z={z} x={x} y={y + bob}><C>{children}</C></Layer>
  </>);
};
const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  return (<AbsoluteFill style={{background: `radial-gradient(ellipse at ${50 + Math.sin(f / 90) * 12}% 38%, ${PAL.bg2} 0%, ${PAL.bg1} 72%)`}}>
    <AbsoluteFill style={{background: `radial-gradient(circle at 80% 18%, rgba(245,196,81,0.16), transparent 45%), radial-gradient(circle at 15% 85%, rgba(45,212,191,0.14), transparent 50%)`}} />
  </AbsoluteFill>);
};
const Hero: React.FC<{text: string; size: number; p: number; y?: number}> = ({text, size, p, y = -150}) => (
  <Layer z={80}><C y={y}>
    <div style={{transformStyle: 'preserve-3d', transform: `translateZ(${(1 - p) * -1100}px) rotateX(${(1 - p) * -70}deg) rotateY(${Math.sin(p * 3) * 4}deg)`, opacity: Math.min(1, p * 2)}}>
      <Text3D text={text} size={size} face={PAL.ice} side={PAL.goldDeep} depth={Math.round(size / 5)} angle={72} style={{position: 'absolute', left: -520, width: 1040, top: -size * 0.7}} />
    </div>
  </C></Layer>
);
const SubBar: React.FC<{text: string; p: number}> = ({text, p}) => (
  <Layer z={200} y={190}><C>
    <div style={{transformStyle: 'preserve-3d', transform: `translateY(${(1 - p) * 120}px) rotateX(${8 + (1 - p) * 40}deg)`, opacity: p}}>
      <Slab3D w={780} h={150} depth={34} radius={44} front="linear-gradient(160deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))" side={PAL.tealDeep} border="rgba(255,255,255,0.4)">
        <div style={{fontFamily: ARABIC_FONT, fontWeight: 800, fontSize: 64, color: PAL.ice, direction: 'rtl'}}>{text}</div>
      </Slab3D>
    </div>
  </C></Layer>
);

export const Broll3D: React.FC<BrollProps> = ({kind, text, sub, items = []}) => {
  const f = useCurrentFrame();
  const p = useIn(0); const p2 = useIn(8);
  return (
    <AbsoluteFill style={{background: PAL.bg1}}>
      <Backdrop />
      <Stage3D orbitX={4} orbitY={9} speed={0.22} push={120} durF={90}>
        {/* far glass slabs: parallax depth */}
        <Layer z={-700} x={-260} y={-520} rotZ={14} dof={0}><C><Slab3D w={620} h={620} depth={26} radius={150} front="rgba(255,255,255,0.07)" side="#13204A" /></C></Layer>
        <Layer z={-520} x={320} y={300} rotZ={-10} dof={0}><C><Slab3D w={520} h={520} depth={26} radius={130} front="rgba(45,212,191,0.16)" side={PAL.tealDeep} /></C></Layer>
        {kind === 'title' && (<>
          <Floaty z={-240} x={-340} y={-560} phase={0}><Cube3D size={170} color={PAL.gold} rx={f * 0.9} ry={f * 1.3} /></Floaty>
          <Floaty z={200} x={350} y={-420} phase={2}><Sphere3D size={160} base={PAL.teal} /></Floaty>
          <Floaty z={-380} x={300} y={480} phase={4}><Ring3D size={250} thick={30} color={PAL.gold} rx={f * 1.2} ry={f * 0.6} /></Floaty>
          <Hero text={text} size={text.length > 7 ? 124 : 190} p={p} />
          {sub ? <SubBar text={sub} p={p2} /> : null}
        </>)}
        {kind === 'stat' && (<>
          <Floaty z={-300} x={-360} y={-520} phase={1}><Ring3D size={300} thick={34} color={PAL.teal} rx={f * 1.1} ry={f * 0.7} /></Floaty>
          <Floaty z={160} x={360} y={-470} phase={3}><Sphere3D size={150} base={PAL.gold} /></Floaty>
          <Layer z={120} y={-140}><C><div style={{transformStyle: 'preserve-3d', transform: `translateZ(${(1 - p) * -1300}px) rotateY(${(1 - p) * 120}deg) scale(${0.96 + Math.sin(f / 18) * 0.02})`, opacity: Math.min(1, p * 2)}}>
            <Text3D text={text} size={420} face={PAL.gold} side={PAL.goldDeep} depth={80} angle={70} style={{position: 'absolute', left: -450, width: 900, top: -300}} />
          </div></C></Layer>
          {sub ? <SubBar text={sub} p={p2} /> : null}
        </>)}
        {kind === 'tunnel' && (<>
          {Array.from({length: 7}).map((_, i) => {
            const z = -3200 + ((i * 520 + f * 22) % 3640);
            return <Layer key={i} z={z}><C><Ring3D size={900} thick={14} color={i % 2 ? PAL.teal : PAL.gold} rx={0} ry={0} /></C></Layer>;
          })}
          <Hero text={text} size={200} p={p} y={-100} />
          {sub ? <SubBar text={sub} p={p2} /> : null}
        </>)}
        {kind === 'stack' && (<>
          {items.slice(0, 3).map((t, i) => {
            const pi = useIn(i * 7);
            return (
              <Layer key={i} z={180 - i * 240} y={-440 + i * 320} x={(i - 1) * 40}><C>
                <div style={{transformStyle: 'preserve-3d', transform: `translateX(${(1 - pi) * 900}px) rotateY(${-14 + (1 - pi) * 50}deg)`, opacity: pi}}>
                  <Slab3D w={820} h={230} depth={40} radius={56} front="linear-gradient(160deg,rgba(255,255,255,0.24),rgba(255,255,255,0.05))" side={i % 2 ? PAL.goldDeep : PAL.tealDeep} border="rgba(255,255,255,0.45)">
                    <div style={{fontFamily: ARABIC_FONT, fontWeight: 900, fontSize: 92, color: PAL.ice, direction: 'rtl'}}>{t}</div>
                  </Slab3D>
                </div>
              </C></Layer>
            );
          })}
          <Hero text={text} size={140} p={p} y={-620} />
        </>)}
      </Stage3D>
      <AbsoluteFill style={{background: `linear-gradient(115deg, transparent ${interpolate(f, [0, 40], [-30, 120])}%, rgba(255,255,255,0.07) ${interpolate(f, [0, 40], [-20, 130])}%, transparent ${interpolate(f, [0, 40], [-10, 140])}%)`}} />
      
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

/* ---------- Callout3D: light, transparent 3D graphics for the top band (never over the face) ----------
 * kinds: headline (hook question), num (big stat), chips (up to 3 terms in a row). Band centre ~ y=235px of 1920. */
export type CalloutProps = {kind: 'headline' | 'num' | 'chips'; text: string; items?: string[]};
export const Callout3D: React.FC<CalloutProps> = ({kind, text, items = []}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const sp = (d: number) => spring({frame: f - d, fps, config: {damping: 13, stiffness: 150, mass: 0.8}});
  const p = sp(0);
  return (
    <Stage3D orbitX={3} orbitY={7} speed={0.25} push={0} durF={1}>
      {(kind === 'headline' || kind === 'num') && (
        <Layer z={60} y={-700}><C>
          <div style={{transformStyle: 'preserve-3d', transform: `translateZ(${(1 - p) * -700}px) rotateX(${(1 - p) * -60}deg) scale(${0.97 + Math.sin(f / 14) * 0.015})`, opacity: Math.min(1, p * 2.2)}}>
            <Text3D text={text} size={kind === 'num' ? 190 : 118} face={kind === 'num' ? PAL.gold : '#FFFFFF'} side={PAL.goldDeep} depth={kind === 'num' ? 40 : 24} angle={72} style={{position: 'absolute', left: -520, width: 1040, top: kind === 'num' ? -150 : -90}} />
          </div>
        </C></Layer>
      )}
      {kind === 'chips' && items.slice(0, 3).map((t, i) => {
        const pi = sp(i * 6);
        return (
          <Layer key={i} z={40} x={(1 - i) * 345} y={-705}><C>
            <div style={{transformStyle: 'preserve-3d', transform: `translateY(${(1 - pi) * -160}px) rotateX(${(1 - pi) * 70}deg) rotateY(${(1 - i) * -9}deg)`, opacity: Math.min(1, pi * 2)}}>
              <Slab3D w={320} h={112} depth={26} radius={34} front="linear-gradient(160deg,rgba(255,255,255,0.30),rgba(255,255,255,0.08))" side={i % 2 ? PAL.goldDeep : PAL.tealDeep} border="rgba(255,255,255,0.55)">
                <div style={{fontFamily: ARABIC_FONT, fontWeight: 900, fontSize: 46, color: '#fff', direction: 'rtl', textShadow: '0 3px 10px rgba(0,0,0,0.6)'}}>{t}</div>
              </Slab3D>
            </div>
          </C></Layer>
        );
      })}
    </Stage3D>
  );
};
