// Studio ad: library b-roll (dimmed, graded) + 3D motion-graphic callouts / Broll3D takeovers, punch captions from the VO, progress bar.
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Broll3D, Callout3D, PAL, applyTheme, type BrollProps} from '../broll3d/Broll3D';
import {PunchCaptions} from '../captions/PunchCaptions';
import {Fonts, ARABIC_FONT, ARABIC_FEATURES} from '../fonts';
import type {CaptionWord} from '../captions/TajawalCaptions';
// Violet "brand ad" look (theme eshaar-violet): navy pill on the ONE spoken keyword, extruded brand word on top.
const PillCaptions: React.FC<{words: CaptionWord[]; bottom: number}> = ({words, bottom}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const ai = Math.max(0, words.findIndex((w, i) => t >= w.start && (i === words.length - 1 || t < words[i + 1].start)));
  return (<div style={{position: 'absolute', left: 40, right: 40, bottom, display: 'flex', justifyContent: 'center', gap: 22, direction: 'rtl', fontFamily: ARABIC_FONT, fontFeatureSettings: ARABIC_FEATURES, zIndex: 6}}>
    {words.map((w, i) => i === ai
      ? <span key={i} style={{background: PAL.pill, color: PAL.accent, fontWeight: 900, fontSize: 84, padding: '4px 30px 10px', borderRadius: 26, boxShadow: '0 10px 0 rgba(10,8,50,0.45)'}}>{w.text}</span>
      : <span key={i} style={{color: 'rgba(255,255,255,0.92)', fontWeight: 800, fontSize: 80, padding: '4px 4px 10px', textShadow: '0 4px 14px rgba(30,10,90,0.6)'}}>{w.text}</span>)}
  </div>);
};
const BrandWord: React.FC<{text: string}> = ({text}) => {
  const ex = Array.from({length: 14}, (_, i) => `0 ${i + 1}px 0 ${i < 7 ? '#FF6B8B' : '#E9456E'}`).join(',');
  return <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', zIndex: 4, fontFamily: ARABIC_FONT, fontFeatureSettings: ARABIC_FEATURES, direction: 'rtl', fontWeight: 900, fontSize: 118, color: '#fff', textShadow: `${ex}, 0 30px 40px rgba(20,5,70,0.45)`}}>{text}</div>;
};
export type AdBeat = {from: number; dur: number; bg?: string; bgStart?: number; callout?: {kind: 'headline' | 'num' | 'chips'; text: string; items?: string[]}; broll?: BrollProps; zoom?: number; extra?: string; lt?: {title: string; sub: string}};
export type AdProps = {beats: AdBeat[]; captions: CaptionWord[][]; audio: string; total: number; doc?: boolean; theme?: number};
const BeatView: React.FC<{b: AdBeat; doc?: boolean}> = ({b, doc}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const n = Math.max(1, b.dur * fps);
  const a = Math.min(1, f / 4, (n - f) / 4);
  const z = 1.04 + (b.zoom ?? 0.08) * (f / n);
  return (
    <AbsoluteFill style={{opacity: Math.max(0, a)}}>
      {b.bg ? (<AbsoluteFill style={{transform: `scale(${z})`}}>
        <OffthreadVideo src={staticFile(b.bg)} startFrom={Math.round((b.bgStart ?? 0) * fps)} muted style={{width: '100%', height: '100%', objectFit: 'cover', filter: PAL.pill ? 'contrast(1.05) saturate(1.1) brightness(0.8)' : doc ? 'sepia(0.28) contrast(1.12) saturate(0.85) brightness(0.85)' : 'contrast(1.12) saturate(1.2) brightness(0.62)'}} />
        <AbsoluteFill style={{background: PAL.pill ? 'linear-gradient(180deg, rgba(58,28,163,0.62) 0%, rgba(110,60,220,0.3) 45%, rgba(40,15,120,0.75) 100%)' : 'linear-gradient(180deg, rgba(5,7,15,0.55) 0%, rgba(5,7,15,0.1) 40%, rgba(5,7,15,0.7) 100%)'}} />
      </AbsoluteFill>) : null}
      {b.lt ? <div style={{position: 'absolute', left: 70, bottom: 430, borderLeft: `8px solid ${PAL.gold}`, paddingLeft: 28, fontFamily: ARABIC_FONT, fontFeatureSettings: ARABIC_FEATURES, direction: 'rtl', textShadow: '0 2px 12px #000'}}><div style={{color: '#fff', fontWeight: 900, fontSize: 60}}>{b.lt.title}</div><div style={{color: '#F5C451', fontWeight: 700, fontSize: 38}}>{b.lt.sub}</div></div> : null}
      {b.broll ? <Broll3D {...b.broll} /> : null}
      {b.callout ? <Callout3D {...b.callout} /> : null}
      {b.extra ? <div style={{position: 'absolute', top: 1010, left: 0, right: 0, textAlign: 'center', fontFamily: ARABIC_FONT, fontFeatureSettings: ARABIC_FEATURES, direction: 'rtl', fontWeight: 900, fontSize: 96, color: '#fff', WebkitTextStroke: '14px #000', paintOrder: 'stroke fill'}}>{b.extra}</div> : null}
    </AbsoluteFill>
  );
};
export const Ad: React.FC<AdProps> = ({beats, captions, audio, total, doc, theme}) => {
  applyTheme(theme ?? 0);
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const t = f / fps;
  const c = captions.find((ch) => t >= ch[0].start - 0.03 && t < ch[ch.length - 1].end + 0.1);
  return (
    <AbsoluteFill style={{background: PAL.pill || '#05070f'}}>
      <Fonts />
      {beats.map((b, i) => <Sequence key={i} from={Math.round(b.from * fps)} durationInFrames={Math.max(1, Math.round(b.dur * fps))}><BeatView b={b} doc={doc} /></Sequence>)}
      <div style={{position: 'absolute', zIndex: 5, bottom: 70, left: 60, right: 60, height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.28)'}}><div style={{width: `${Math.min(100, (t / total) * 100)}%`, height: '100%', borderRadius: 6, background: PAL.accent, marginLeft: 'auto'}} /></div>
      {doc ? <><AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)'}} /><div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 170, background: '#000'}} /><div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 170, background: '#000'}} /></> : null}
      {PAL.pill && t < beats[beats.length - 1].from ? <BrandWord text="استوديو" /> : null}
      {c && PAL.pill ? <PillCaptions words={c} bottom={230} /> : null}
      {c && !PAL.pill ? <PunchCaptions words={c} accent={PAL.accent} bottom={doc ? 215 : 230} fontSize={doc ? 70 : 88} /> : null}
      <Audio src={staticFile(audio)} />
    </AbsoluteFill>
  );
};
