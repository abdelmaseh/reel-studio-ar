// Tajawal RTL per-word Arabic captions with Whisper word timings and kashida emphasis.
// Kashida engine: vendored reel-studio arabic module (Apache-2.0), placed only on legal
// joining slots (never after ا د ر ز و ة ..., never inside lam-alef, never at word edges).
import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {stretchWord} from '../vendor/reel-studio/arabic/kashida.ts';

export type CaptionWord = {
  text: string;
  /** seconds, composition clock */
  start: number;
  end: number;
};

export type TajawalCaptionsProps = {
  words: CaptionWord[];
  /** Tatweels added to the spoken word (0 = off). 1-2 reads premium, more reads comic. */
  kashida?: number;
  fontSize?: number;
  /** dim color for words not yet spoken */
  dimColor?: string;
  color?: string;
  activeColor?: string;
  /** pill behind the active word; set null to disable */
  activePill?: string | null;
  /** distance from the bottom edge in px (keep clear of platform UI: >= 350) */
  bottom?: number;
  maxWidth?: number;
};

export const TajawalCaptions: React.FC<TajawalCaptionsProps> = ({
  words,
  kashida = 2,
  fontSize = 64,
  dimColor = 'rgba(255,255,255,0.38)',
  color = '#FFFFFF',
  activeColor = '#FFD34D',
  activePill = 'rgba(0,0,0,0.45)',
  bottom = 420,
  maxWidth = 920,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          bottom,
          left: '50%',
          transform: 'translateX(-50%)',
          width: maxWidth,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: fontSize * 0.28,
          rowGap: fontSize * 0.18,
          fontFamily: "'Tajawal', sans-serif",
          fontWeight: 800,
          fontSize,
          lineHeight: 1.35,
          textAlign: 'center',
        }}
      >
        {words.map((w, i) => {
          const started = t >= w.start;
          const active = t >= w.start && t < w.end;
          const pop = active
            ? spring({frame: frame - Math.round(w.start * fps), fps, config: {damping: 14, stiffness: 240, mass: 0.6}})
            : 1;
          const shown = active && kashida > 0 ? stretchWord(w.text, kashida) : w.text;
          return (
            <span
              key={i}
              style={{
                position: 'relative',
                color: active ? activeColor : started ? color : dimColor,
                transform: `scale(${active ? pop : 1})`,
                padding: active && activePill ? `0 ${fontSize * 0.16}px` : undefined,
                borderRadius: active && activePill ? fontSize * 0.22 : undefined,
                background: active && activePill ? activePill : undefined,
                textShadow: '0 2px 18px rgba(0,0,0,0.55)',
              }}
            >
              {shown}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
