// depth3d kit — real CSS-3D depth for the "3d" style (pop energy + perspective, parallax, contact shadows,
// depth-of-field blur, extruded text). Pure DOM/CSS transforms: deterministic per frame, no WebGL, offline.
// Conventions: every motion is a pure function of the frame (Remotion), units are px, z>0 is toward camera.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';

export const PERSPECTIVE = 1500;

/** Perspective scene with a gently orbiting camera. Children use <Layer z> / <Slab3D> / <Solid3D>. */
export const Stage3D: React.FC<{
  orbitX?: number; // deg of vertical sway
  orbitY?: number; // deg of horizontal sway
  speed?: number; // sway cycles per second
  push?: number; // slow push-in (px of translateZ) over the whole scene
  durF?: number;
  children?: React.ReactNode;
}> = ({orbitX = 5, orbitY = 9, speed = 0.18, push = 140, durF = 150, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const rx = Math.sin(t * Math.PI * 2 * speed) * orbitX;
  const ry = Math.cos(t * Math.PI * 2 * speed * 0.8) * orbitY;
  const z = (Math.min(1, frame / durF)) * push;
  return (
    <AbsoluteFill style={{perspective: PERSPECTIVE, perspectiveOrigin: '50% 46%', overflow: 'hidden'}}>
      <AbsoluteFill style={{transformStyle: 'preserve-3d', transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A plane at depth z. Parallax comes from the camera orbit moving layers at different apparent speeds.
 *  focusZ/dof add a depth-of-field blur that grows with distance from the focus plane. */
export const Layer: React.FC<{
  z: number;
  x?: number;
  y?: number;
  rotZ?: number;
  focusZ?: number;
  dof?: number;
  opacity?: number;
  children?: React.ReactNode;
}> = ({z, x = 0, y = 0, rotZ = 0, focusZ = 0, dof = 0.012, opacity = 1, children}) => {
  const blur = Math.max(0, Math.abs(z - focusZ) * dof);
  return (
    <AbsoluteFill
      style={{
        transformStyle: 'preserve-3d',
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateZ(${rotZ}deg)`,
        filter: blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : undefined,
        opacity,
        pointerEvents: 'none',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Soft contact shadow on an imaginary floor: grows, fades and blurs with the height of the object above it. */
export const ContactShadow: React.FC<{width: number; height: number; lift: number; max?: number}> = ({width, height, lift, max = 400}) => {
  const k = Math.min(1, Math.max(0, lift / max));
  return (
    <div
      style={{
        position: 'absolute',
        width: width * (1 - k * 0.35),
        height: height * (1 - k * 0.3),
        borderRadius: '50%',
        background: `rgba(10,4,40,${0.5 - k * 0.32})`,
        filter: `blur(${22 + k * 34}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
};

/** Slab with real thickness: stacked back faces create the extrusion, rim light on the front edge. */
export const Slab3D: React.FC<{
  w: number;
  h: number;
  depth?: number;
  radius?: number;
  front: string; // CSS background of the front face
  side: string; // colour of the extruded sides
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  border?: string;
  children?: React.ReactNode;
}> = ({w, h, depth = 36, radius = 44, front, side, rotX = 0, rotY = 0, rotZ = 0, border = 'rgba(255,255,255,0.35)', children}) => {
  const layers = Math.max(2, Math.round(depth / 3));
  return (
    <div style={{position: 'absolute', width: w, height: h, left: -w / 2, top: -h / 2, transformStyle: 'preserve-3d', transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`}}>
      {Array.from({length: layers}).map((_, i) => (
        <div key={i} style={{position: 'absolute', inset: 0, borderRadius: radius, background: side, filter: `brightness(${0.62 + 0.3 * (1 - i / layers)})`, transform: `translateZ(${-(i + 1) * (depth / layers)}px)`}} />
      ))}
      <div style={{position: 'absolute', inset: 0, borderRadius: radius, background: front, boxShadow: `inset 0 0 0 3px ${border}, inset 0 18px 40px rgba(255,255,255,0.18)`, transform: 'translateZ(0.5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
        {children}
      </div>
    </div>
  );
};

/** CSS cube (6 lit faces) for hero floaters. */
export const Cube3D: React.FC<{size: number; color: string; rx: number; ry: number; rz?: number}> = ({size, color, rx, ry, rz = 0}) => {
  const h = size / 2;
  const face = (t: string, b: number): React.CSSProperties => ({position: 'absolute', width: size, height: size, left: -h, top: -h, borderRadius: size * 0.16, background: color, filter: `brightness(${b})`, boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.28)', transform: t});
  return (
    <div style={{position: 'absolute', transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`}}>
      <div style={face(`translateZ(${h}px)`, 1.15)} />
      <div style={face(`rotateY(180deg) translateZ(${h}px)`, 0.6)} />
      <div style={face(`rotateY(90deg) translateZ(${h}px)`, 0.85)} />
      <div style={face(`rotateY(-90deg) translateZ(${h}px)`, 0.72)} />
      <div style={face(`rotateX(90deg) translateZ(${h}px)`, 1.3)} />
      <div style={face(`rotateX(-90deg) translateZ(${h}px)`, 0.5)} />
    </div>
  );
};

/** Lit sphere: offset radial highlight + core shadow + rim, reads as a ball even without WebGL. */
export const Sphere3D: React.FC<{size: number; base: string; light?: string; dark?: string}> = ({size, base, light = '#fff', dark = '#1a0b44'}) => (
  <div
    style={{
      position: 'absolute',
      width: size,
      height: size,
      left: -size / 2,
      top: -size / 2,
      borderRadius: '50%',
      background: `radial-gradient(circle at 32% 28%, ${light} 0%, ${base} 38%, ${dark} 100%)`,
      boxShadow: `inset -${size * 0.08}px -${size * 0.1}px ${size * 0.2}px rgba(0,0,0,0.35), inset 0 0 0 2px rgba(255,255,255,0.15)`,
    }}
  />
);

/** Torus-like ring (thick border with gradient) that spins around X. */
export const Ring3D: React.FC<{size: number; thick: number; color: string; rx: number; ry: number}> = ({size, thick, color, rx, ry}) => (
  <div style={{position: 'absolute', width: size, height: size, left: -size / 2, top: -size / 2, borderRadius: '50%', border: `${thick}px solid ${color}`, boxShadow: `inset 0 0 ${thick}px rgba(0,0,0,0.35), 0 0 ${thick}px rgba(255,255,255,0.2)`, transform: `rotateX(${rx}deg) rotateY(${ry}deg)`}} />
);

/** Extruded text: stacked 1px offsets of the same glyphs (keeps Arabic joining intact), then a soft drop shadow.
 *  No letter-spacing and no per-letter transforms (they break Arabic connection). */
export const Text3D: React.FC<{
  text: string;
  size: number;
  face: string;
  side: string;
  depth?: number;
  angle?: number; // extrusion direction in deg (0 = right, 90 = down)
  shadow?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({text, size, face, side, depth = 22, angle = 60, shadow = 'rgba(15,5,50,0.5)', weight = 900, style}) => {
  const dx = Math.cos((angle * Math.PI) / 180);
  const dy = Math.sin((angle * Math.PI) / 180);
  const shades: string[] = [];
  for (let i = 1; i <= depth; i++) shades.push(`${(dx * i).toFixed(2)}px ${(dy * i).toFixed(2)}px 0 ${side}`);
  shades.push(`${dx * depth + 6}px ${dy * depth + 24}px 36px ${shadow}`);
  return (
    <div style={{fontFamily: "'Cairo', 'Tajawal', sans-serif", fontFeatureSettings: '"ccmp" 1, "calt" 1, "liga" 1, "mark" 1, "mkmk" 1', fontWeight: weight, fontSize: size, lineHeight: 1.25, color: face, textShadow: shades.join(','), direction: 'rtl', textAlign: 'center', whiteSpace: 'nowrap', ...style}}>
      {text}
    </div>
  );
};
