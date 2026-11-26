// Short-form "punch" captions: 2-3 words per card, heavy Cairo, thick black stroke, words appear as spoken,
// the spoken word turns the accent colour and pops. Sentence-case Arabic (no caps, no letter-spacing: keeps joining intact).
import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ARABIC_FONT, ARABIC_FEATURES} from '../fonts';
import type {CaptionWord} from './TajawalCaptions';

export const PunchCaptions: React.FC<{words: CaptionWord[]; accent?: string; bottom?: number; fontSize?: number}> = ({words, accent = '#FFD23F', bottom = 640, fontSize = 96}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); const t = frame / fps;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div dir="rtl" style={{position: 'absolute', bottom, left: '50%', transform: 'translateX(-50%)', width: 940, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: fontSize * 0.26, fontFamily: ARABIC_FONT, fontWeight: 900, fontFeatureSettings: ARABIC_FEATURES, fontSize, lineHeight: 1.3, textAlign: 'center'}}>
        {words.map((w, i) => {
          if (t < w.start - 0.02) return <span key={i} style={{opacity: 0}}>{w.text}</span>;
          const active = t < w.end;
          const pop = spring({frame: frame - Math.round(w.start * fps), fps, config: {damping: 12, stiffness: 260, mass: 0.5}});
          return (
            <span key={i} style={{display: 'inline-block', color: active ? accent : '#fff', transform: `scale(${active ? 0.82 + 0.28 * pop : 1})`, WebkitTextStroke: `${Math.round(fontSize * 0.15)}px #000`, paintOrder: 'stroke fill', textShadow: '0 8px 0 rgba(0,0,0,0.35)'}}>{w.text}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
