// "3d" style showcase: pop energy + real depth. VO is the master clock (timings3d.json).
// Scenes: hook / 3D logo / tilted deep cards / parallax layers / floaters with DOF / extruded Arabic / CTA.
import React from 'react';
import {AbsoluteFill, Sequence, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraBlur} from '../vendor/reel-studio/core/mblur';
import {Grain, Vignette, FlashBloom} from '../vendor/reel-studio/core/transitions';
import {Stage3D, Layer, ContactShadow, Slab3D, Cube3D, Sphere3D, Ring3D, Text3D} from '../vendor/reel-studio/kits/depth3d';
import {TajawalCaptions} from '../captions/TajawalCaptions';
import {STYLES} from '../styles';
import {Fonts, ARABIC_FONT} from '../fonts';
import T from './timings3d.json';

export const DEMO3D_FRAMES = Math.ceil(T.total * 50);
const S = STYLES['3d'];
const PURPLE = '#3B1C99';
/** drop-in with overshoot: depth pop from far away (translateZ) + tilt settle */
const useIn = (delay = 0, cfg = {damping: 13, stiffness: 120, mass: 0.9}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: cfg});
};

const Floaty: React.FC<{z: number; x: number; y: number; phase: number; amp?: number; children: React.ReactNode; focusZ?: number; shadowW?: number}> = ({z, x, y, phase, amp = 26, children, focusZ = 0, shadowW = 170}) => {
  const f = useCurrentFrame();
  const bob = Math.sin(f / 22 + phase) * amp;
  return (
    <>
      <Layer z={z} x={x} y={y + 620} focusZ={focusZ}>
        <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'rotateX(78deg)'}}>
          <ContactShadow width={shadowW} height={shadowW * 0.5} lift={bob + amp + 80} max={260} />
        </div>
      </Layer>
      <Layer z={z} x={x} y={y + bob} focusZ={focusZ}>
        <div style={{position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d'}}>{children}</div>
      </Layer>
    </>
  );
};

const Center: React.FC<{children: React.ReactNode; y?: number}> = ({children, y = 0}) => (
  <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(0,${y}px)`, transformStyle: 'preserve-3d'}}>{children}</div>
);

/* ---------- scenes (each runs on its own local frame via Sequence) ---------- */
const Scene1: React.FC = () => {
  const p = useIn(0);
  const rot = (1 - p) * -80;
  const f = useCurrentFrame();
  return (
    <Stage3D orbitY={11} orbitX={6} push={180} durF={200}>
      <Floaty z={-260} x={-330} y={-520} phase={0} focusZ={0}><Cube3D size={190} color="#FF5C8A" rx={f * 0.9} ry={f * 1.3} /></Floaty>
      <Floaty z={160} x={340} y={-380} phase={2} focusZ={0}><Sphere3D size={170} base="#64E4FF" /></Floaty>
      <Floaty z={-420} x={300} y={420} phase={4} focusZ={0}><Ring3D size={260} thick={34} color="#FFD34D" rx={f * 1.2} ry={f * 0.6} /></Floaty>
      <Layer z={60}>
        <Center y={-60}>
          <div style={{transform: `translateZ(${(1 - p) * -900}px) rotateX(${rot}deg)`, transformStyle: 'preserve-3d'}}>
            <Text3D text="ثلاثي الأبعاد؟" size={150} face="#FFFFFF" side="#FF5C8A" depth={34} angle={70} style={{position: 'absolute', left: -480, width: 960, top: -130}} />
          </div>
        </Center>
      </Layer>
    </Stage3D>
  );
};

const Scene2: React.FC = () => {
  const p = useIn(0, {damping: 10, stiffness: 90, mass: 1.1});
  const f = useCurrentFrame();
  return (
    <Stage3D orbitY={16} orbitX={6} speed={0.25} push={120} durF={160}>
      <Floaty z={-300} x={-360} y={380} phase={1} focusZ={0}><Cube3D size={150} color="#64E4FF" rx={30 + f * 1.1} ry={f * 1.6} /></Floaty>
      <Floaty z={200} x={360} y={-420} phase={3} focusZ={0}><Sphere3D size={120} base="#FFD34D" /></Floaty>
      <Layer z={0}>
        <Center y={-40}>
          <div style={{transformStyle: 'preserve-3d', transform: `translateZ(${(1 - p) * -700}px) rotateY(${(1 - p) * 120 + Math.sin(f / 30) * 10}deg)`}}>
            <Text3D text="3D" size={520} face="#FFD34D" side="#C9701A" depth={60} angle={65} weight={900} style={{position: 'absolute', left: -450, width: 900, top: -330, fontFamily: ARABIC_FONT}} />
          </div>
        </Center>
      </Layer>
    </Stage3D>
  );
};

const CARDS = [
  {t: 'عمق', c: 'linear-gradient(160deg,#FFFFFF,#E9E2FF)', s: '#7B5CFF'},
  {t: 'ظل', c: 'linear-gradient(160deg,#FFE3EE,#FFB0CB)', s: '#C23A78'},
  {t: 'منظور', c: 'linear-gradient(160deg,#DDF8FF,#9BE8FF)', s: '#1789A6'},
];
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Stage3D orbitY={18} orbitX={8} speed={0.22} push={140} durF={200}>
      {CARDS.map((c, i) => {
        const p = useIn(i * 7, {damping: 12, stiffness: 110, mass: 0.9});
        const z = (1 - i) * -240 + (1 - p) * -1000;
        const x = (i - 1) * -230;
        const y = (i - 1) * 150 + Math.sin(f / 25 + i) * 14;
        return (
          <Layer key={i} z={z} x={x} y={y} focusZ={0} dof={0.01}>
            <Center>
              <Slab3D w={620} h={460} depth={44} front={c.c} side={c.s} rotY={-24 + (i - 1) * 6} rotX={8} rotZ={(i - 1) * 3}>
                <div style={{fontFamily: ARABIC_FONT, fontWeight: 900, fontSize: 150, color: PURPLE, direction: 'rtl'}}>{c.t}</div>
              </Slab3D>
            </Center>
          </Layer>
        );
      })}
    </Stage3D>
  );
};

const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const layers = [
    {z: -700, c: 'rgba(255,255,255,0.16)', w: 760, h: 760, x: -240, y: -420, r: 18},
    {z: -450, c: 'rgba(100,228,255,0.35)', w: 640, h: 640, x: 260, y: 140, r: -12},
    {z: -200, c: 'rgba(255,92,138,0.6)', w: 560, h: 560, x: -260, y: 360, r: 9},
    {z: 100, c: 'rgba(255,211,77,0.95)', w: 420, h: 420, x: 280, y: -360, r: -15},
    {z: 330, c: 'rgba(255,255,255,0.92)', w: 340, h: 340, x: -280, y: -120, r: 12},
  ];
  return (
    <Stage3D orbitY={26} orbitX={12} speed={0.3} push={200} durF={220}>
      {layers.map((l, i) => {
        const p = useIn(i * 5);
        return (
          <Layer key={i} z={l.z - (1 - p) * 900} x={l.x} y={l.y + Math.sin(f / 30 + i) * 18} rotZ={l.r} focusZ={100} dof={0.008}>
            <Center><Slab3D w={l.w} h={l.h} depth={30} radius={l.w / 4} front={l.c} side="#3B1C99" /></Center>
          </Layer>
        );
      })}
    </Stage3D>
  );
};

const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Stage3D orbitY={14} orbitX={7} push={160} durF={200}>
      <Floaty z={-700} x={-380} y={-300} phase={0} focusZ={50} shadowW={150}><Sphere3D size={230} base="#FF5C8A" /></Floaty>
      <Floaty z={-500} x={380} y={420} phase={1.5} focusZ={50} shadowW={180}><Cube3D size={220} color="#64E4FF" rx={f * 1.0} ry={f * 1.5} /></Floaty>
      <Floaty z={50} x={0} y={-60} phase={3} amp={34} focusZ={50} shadowW={360}>
        <Cube3D size={330} color="#FFD34D" rx={20 + f * 0.8} ry={f * 1.9} rz={8} />
      </Floaty>
      <Floaty z={420} x={-330} y={380} phase={4} focusZ={50} shadowW={200}><Sphere3D size={210} base="#7B5CFF" light="#E9E2FF" /></Floaty>
      <Floaty z={500} x={360} y={-520} phase={5} focusZ={50} shadowW={160}><Ring3D size={260} thick={40} color="#FFFFFF" rx={f * 1.4} ry={f * 0.7} /></Floaty>
    </Stage3D>
  );
};

const Scene6: React.FC = () => {
  const p = useIn(0, {damping: 9, stiffness: 100, mass: 1});
  const f = useCurrentFrame();
  return (
    <Stage3D orbitY={20} orbitX={8} speed={0.28} push={130} durF={160}>
      <Floaty z={-350} x={330} y={470} phase={2} focusZ={0}><Cube3D size={170} color="#FF5C8A" rx={f} ry={f * 1.4} /></Floaty>
      <Layer z={0}>
        <Center y={-70}>
          <div style={{transformStyle: 'preserve-3d', transform: `translateZ(${(1 - p) * -800}px) rotateX(${(1 - p) * 70}deg)`}}>
            <Text3D text="سمك" size={330} face="#FFFFFF" side="#7B2FD6" depth={52} angle={72} style={{position: 'absolute', left: -450, width: 900, top: -400}} />
            <Text3D text="وعمق" size={330} face="#FFD34D" side="#C9701A" depth={52} angle={72} style={{position: 'absolute', left: -450, width: 900, top: -50}} />
          </div>
        </Center>
      </Layer>
    </Stage3D>
  );
};

const Scene7: React.FC = () => {
  const p = useIn(0);
  const f = useCurrentFrame();
  const typed = 'ثري دي';
  const n = Math.max(0, Math.min(typed.length, Math.floor((f - 40) / 6)));
  return (
    <Stage3D orbitY={12} orbitX={6} push={120} durF={170}>
      <Floaty z={-300} x={-380} y={-460} phase={0} focusZ={0}><Sphere3D size={190} base="#64E4FF" /></Floaty>
      <Floaty z={-250} x={380} y={460} phase={2} focusZ={0}><Cube3D size={170} color="#FFD34D" rx={f} ry={f * 1.3} /></Floaty>
      <Layer z={40}>
        <Center>
          <div style={{transformStyle: 'preserve-3d', transform: `translateZ(${(1 - p) * -900}px) rotateY(${(1 - p) * -70}deg)`}}>
            <Slab3D w={800} h={260} depth={50} radius={60} front="linear-gradient(160deg,#FFFFFF,#EFEAFF)" side="#FF5C8A" rotX={6} rotY={-8}>
              <div style={{fontFamily: ARABIC_FONT, fontWeight: 900, fontSize: 112, color: PURPLE, direction: 'rtl'}}>{typed.slice(0, n)}<span style={{opacity: f % 30 < 15 ? 1 : 0}}>|</span></div>
            </Slab3D>
          </div>
        </Center>
      </Layer>
    </Stage3D>
  );
};

const SCENES = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7];

export const Demo3D: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  let si = 0;
  T.scenes.forEach((sc, i) => { if (t >= sc.start - 0.05) si = i; });
  const lo = T.scenes[si].start - 0.1, hi = (T.scenes[si + 1]?.start ?? 999) - 0.1;
  const capWords = T.words.filter((w) => w.start >= lo && w.start < hi);
  const hue = Math.sin(f / 160) * 14;
  return (
    <AbsoluteFill style={{background: S.bg1}}>
      <Fonts />
      <AbsoluteFill style={{background: S.bg2, opacity: 0.5 + 0.5 * Math.sin(f / 90), filter: `hue-rotate(${hue}deg)`}} />
      {T.scenes.map((sc, i) => {
        const from = Math.round(sc.start * fps) - (i === 0 ? 0 : 4);
        const to = i === T.scenes.length - 1 ? DEMO3D_FRAMES : Math.round(T.scenes[i + 1].start * fps) - 4 + 6;
        const C = SCENES[i];
        const local = f - from;
        // motion blur only during the fast entrance: a subtree re-render per sample is expensive
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} layout="none">
            <AbsoluteFill>
              <CameraBlur shutter="film180" enabled={i !== 3 && local >= 0 && local < 10}>
                <C />
              </CameraBlur>
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {T.scenes.map((sc, i) => (i === 0 ? null : <FlashBloom key={i} at={sc.start - 0.08} peak={0.22} />))}
      <TajawalCaptions
        kashida={S.captions.kashida}
        bottom={420}
        color={S.captions.color}
        activeColor={S.captions.activeColor}
        dimColor={S.captions.dimColor}
        activePill={S.captions.activePill}
        words={capWords}
      />
      <Grain opacity={S.grain} />
      <Vignette strength={S.vignette} />
    </AbsoluteFill>
  );
};
