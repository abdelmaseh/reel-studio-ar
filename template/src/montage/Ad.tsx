// Studio ad: library b-roll (dimmed, graded) + 3D motion-graphic callouts / Broll3D takeovers, punch captions from the VO, progress bar.
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Broll3D, Callout3D, type BrollProps} from '../broll3d/Broll3D';
import {PunchCaptions} from '../captions/PunchCaptions';
import {Fonts, ARABIC_FONT, ARABIC_FEATURES} from '../fonts';
import type {CaptionWord} from '../captions/TajawalCaptions';
export type AdBeat = {from: number; dur: number; bg?: string; bgStart?: number; callout?: {kind: 'headline' | 'num' | 'chips'; text: string; items?: string[]}; broll?: BrollProps; zoom?: number; extra?: string};
export type AdProps = {beats: AdBeat[]; captions: CaptionWord[][]; audio: string; music?: string; total: number};
const BeatView: React.FC<{b: AdBeat}> = ({b}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const n = Math.max(1, b.dur * fps);
  const a = Math.min(1, f / 4, (n - f) / 4);
  const z = 1.04 + (b.zoom ?? 0.08) * (f / n);
  return (
    <AbsoluteFill style={{opacity: Math.max(0, a)}}>
      {b.bg ? (<AbsoluteFill style={{transform: `scale(${z})`}}>
        <OffthreadVideo src={staticFile(b.bg)} startFrom={Math.round((b.bgStart ?? 0) * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'contrast(1.12) saturate(1.2) brightness(0.62)'}} />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(5,7,15,0.55) 0%, rgba(5,7,15,0.1) 40%, rgba(5,7,15,0.7) 100%)'}} />
      </AbsoluteFill>) : null}
      {b.broll ? <Broll3D {...b.broll} /> : null}
      {b.callout ? <Callout3D {...b.callout} /> : null}
      {b.extra ? <div style={{position: 'absolute', top: 1010, left: 0, right: 0, textAlign: 'center', fontFamily: ARABIC_FONT, fontFeatureSettings: ARABIC_FEATURES, direction: 'rtl', fontWeight: 900, fontSize: 96, color: '#fff', WebkitTextStroke: '14px #000', paintOrder: 'stroke fill'}}>{b.extra}</div> : null}
    </AbsoluteFill>
  );
};
export const Ad: React.FC<AdProps> = ({beats, captions, audio, music, total}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const c = captions.find((ch) => t >= ch[0].start - 0.03 && t < ch[ch.length - 1].end + 0.1);
  return (
    <AbsoluteFill style={{background: '#05070f'}}>
      <Fonts />
      {beats.map((b, i) => <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.max(1, Math.round(b.dur * fps))}><BeatView b={b} /></Sequence>)}
      <div style={{position: 'absolute', bottom: 70, left: 60, right: 60, height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.28)'}}><div style={{width: `${Math.min(100, (t / total) * 100)}%`, height: '100%', borderRadius: 6, background: '#FFD23F', marginLeft: 'auto'}} /></div>
      {c ? <PunchCaptions words={c} bottom={230} fontSize={88} /> : null}
      <Audio src={staticFile(audio)} />
      {music ? <Audio src={staticFile(music)} volume={0.12} /> : null}
    </AbsoluteFill>
  );
};
