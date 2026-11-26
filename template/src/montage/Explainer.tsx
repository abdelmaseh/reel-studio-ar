// Explainer reel: beats that show each style in action (clips of our own renders) or as a StyleFrame, with spring-in motion,
// before/after and split-screen demo beats, a label chip per beat, and a progress bar.
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {StyleFrame} from '../styleboard/StyleFrame';
import {Fonts, ARABIC_FONT, ARABIC_FEATURES} from '../fonts';
export type Src = {src: string; start: number};
export type Beat = {kind: 'style' | 'video' | 'ba' | 'split'; id?: string; a?: Src; b?: Src; label?: string; from: number; dur: number};
export type ExplainerProps = {beats: Beat[]; audio: string; total: number};
const Vid: React.FC<{s: Src; style?: React.CSSProperties}> = ({s, style}) => {
  const {fps} = useVideoConfig();
  return <OffthreadVideo src={staticFile(s.src)} startFrom={Math.round(s.start * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />;
};
const Tag: React.FC<{t: string; top?: number; right?: number; left?: number}> = ({t, top = 150, right, left}) => (
  <div style={{position: 'absolute', top, right, left, background: '#FFD23F', color: '#111', borderRadius: 40, padding: '10px 34px', fontFamily: ARABIC_FONT, fontFeatureSettings: ARABIC_FEATURES, fontWeight: 900, fontSize: 56, direction: 'rtl', boxShadow: '0 8px 0 rgba(0,0,0,.5)'}}>{t}</div>
);
const BeatView: React.FC<{b: Beat}> = ({b}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const p = spring({frame: f, fps, config: {damping: 14, stiffness: 160, mass: 0.7}});
  const z = 1.0 + 0.05 * (f / Math.max(1, b.dur * fps));
  const out = interpolate(f, [b.dur * fps - 3, b.dur * fps], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let body: React.ReactNode;
  if (b.kind === 'style') body = <StyleFrame id={b.id!} bgDoc="interview/f_doc.jpg" bgHost="interview/f_host.jpg" />;
  else if (b.kind === 'video') body = <Vid s={b.a!} />;
  else if (b.kind === 'ba') body = (<AbsoluteFill><div style={{position: 'absolute', inset: 0, clipPath: 'inset(0 50% 0 0)'}}><Vid s={b.a!} /></div><div style={{position: 'absolute', inset: 0, clipPath: 'inset(0 0 0 50%)'}}><Vid s={b.b!} /></div><div style={{position: 'absolute', top: 0, bottom: 0, left: 538, width: 4, background: '#fff'}} /><Tag t="قبل" top={250} left={60} /><Tag t="بعد التلوين" top={250} right={40} /></AbsoluteFill>);
  else body = (<AbsoluteFill><div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 958, overflow: 'hidden'}}><Vid s={b.a!} /></div><div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 958, overflow: 'hidden'}}><Vid s={b.b!} /></div><div style={{position: 'absolute', left: 0, right: 0, top: 956, height: 8, background: '#FFD23F'}} /></AbsoluteFill>);
  return <AbsoluteFill style={{opacity: out, transform: `scale(${(0.92 + 0.08 * p) * z}) translateY(${(1 - p) * 60}px)`}}>{body}{b.label && b.kind !== 'style' ? <Tag t={b.label} top={b.kind === 'ba' ? 150 : 170} right={b.kind === 'ba' ? 300 : 60} /> : null}</AbsoluteFill>;
};
export const Explainer: React.FC<ExplainerProps> = ({beats, audio, total}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  return (
    <AbsoluteFill style={{background: '#05070f'}}>
      <Fonts />
      {beats.map((b, i) => <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.round(b.dur * fps)}><BeatView b={b} /></Sequence>)}
      <div style={{position: 'absolute', bottom: 60, left: 60, right: 60, height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.28)'}}><div style={{width: `${Math.min(100, (t / total) * 100)}%`, height: '100%', borderRadius: 6, background: '#FFD23F', marginLeft: 'auto'}} /></div>
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
