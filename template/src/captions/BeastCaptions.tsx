// MrBeast-style captions: 1-2 giant words, bright rotating colours (green / yellow / white / pink), heavy black stroke,
// tilt, hard bounce-in. Arabic-safe: no letter-spacing, no caps.
import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ARABIC_FONT, ARABIC_FEATURES} from '../fonts';
import type {CaptionWord} from './TajawalCaptions';
const COLS = ['#3DFF7A', '#FFD23F', '#FFFFFF', '#FF4FA3'];
export const BeastCaptions: React.FC<{words: CaptionWord[]; seed?: number; bottom?: number; fontSize?: number}> = ({words, seed = 0, bottom = 600, fontSize = 128}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); const t = frame / fps;
  const idx = Math.max(0, words.findIndex((w) => t < w.end));
  const w = words[idx === -1 ? words.length - 1 : idx];
  const shown = words.slice(Math.max(0, idx - 1), idx + 1).filter((x) => t >= x.start - 0.02);
  const pop = spring({frame: frame - Math.round(w.start * fps), fps, config: {damping: 9, stiffness: 320, mass: 0.5}});
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div dir="rtl" style={{position: 'absolute', bottom, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30, fontFamily: ARABIC_FONT, fontWeight: 900, fontFeatureSettings: ARABIC_FEATURES, fontSize, lineHeight: 1.2, transform: `rotate(${((words[0].start * 7 + seed) % 2 < 1 ? -3 : 3)}deg)`}}>
        {shown.map((x, k) => {
          const gi = words.indexOf(x); const cur = x === w;
          return <span key={gi} style={{display: 'inline-block', color: COLS[(gi + seed) % COLS.length], transform: `scale(${cur ? 0.7 + 0.42 * pop : 0.92})`, WebkitTextStroke: `${Math.round(fontSize * 0.2)}px #000`, paintOrder: 'stroke fill', textShadow: '0 12px 0 rgba(0,0,0,0.55)'}}>{x.text}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};
