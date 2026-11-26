// EDL-driven montage: hard cuts, beat-snapped pacing, transitions (flash / whip / zoom-punch),
// continuous push-in so the camera is never still, optional speed ramps and J-cuts (audio leads picture).
import React from 'react';
import {AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type EdlClip = {
  src: string;            // file under public/ (e.g. "montage-sample/a.mp4") or absolute URL
  in?: number;            // seconds into the source
  dur: number;            // seconds on the timeline
  speed?: number;         // playback speed (default 1)
  transition?: 'cut' | 'flash' | 'whip' | 'zoom';  // transition INTO this clip
  push?: number;          // push-in amount over the shot, e.g. 0.06 (default 0.05, 0 disables)
  jcut?: number;          // seconds this clip's audio starts before its picture
  volume?: number;
};
export type Edl = {clips: EdlClip[]; music?: {src: string; volume?: number; startFrom?: number}};
export type MontageProps = {edl: Edl};

const TR_FRAMES = 8;
const url = (s: string) => (/^https?:|^file:/.test(s) ? s : staticFile(s));

/** Total timeline length in seconds. */
export const edlSeconds = (edl: Edl) => edl.clips.reduce((a, c) => a + c.dur, 0);

const ShotView: React.FC<{clip: EdlClip; frames: number}> = ({clip, frames}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const tr = clip.transition ?? 'cut';
  const push = clip.push ?? 0.05;
  const scale = 1 + push * (frame / Math.max(1, frames));
  const inT = Math.min(frame, TR_FRAMES) / TR_FRAMES;
  const e = Easing.bezier(0.16, 1, 0.3, 1)(inT);
  let transform = `scale(${scale})`; let filter: string | undefined; let flash = 0;
  if (tr === 'zoom') transform = `scale(${scale * (1.18 - 0.18 * e)})`;
  if (tr === 'whip') { transform = `translateX(${(1 - e) * 540}px) scale(${scale})`; filter = `blur(${(1 - e) * 18}px)`; }
  if (tr === 'flash') flash = interpolate(frame, [0, 5], [0.9, 0], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform, filter}}>
        <OffthreadVideo src={url(clip.src)} startFrom={Math.round((clip.in ?? 0) * fps)} playbackRate={clip.speed ?? 1} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{background: '#fff', opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

export const Montage: React.FC<MontageProps> = ({edl}) => {
  const {fps} = useVideoConfig();
  let t = 0;
  const parts = edl.clips.map((c, i) => {
    const start = Math.round(t * fps); const frames = Math.max(1, Math.round(c.dur * fps)); t += c.dur;
    const lead = Math.round((c.jcut ?? 0) * fps);
    return {c, i, start, frames, lead};
  });
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {parts.map(({c, i, start, frames}) => (
        <Sequence key={`v${i}`} from={start} durationInFrames={frames}><ShotView clip={c} frames={frames} /></Sequence>
      ))}
      {parts.map(({c, i, start, frames, lead}) => (
        <Sequence key={`a${i}`} from={Math.max(0, start - lead)} durationInFrames={frames + lead}>
          <Audio src={url(c.src)} startFrom={Math.max(0, Math.round((c.in ?? 0) * fps) - lead)} playbackRate={c.speed ?? 1} volume={c.volume ?? 1} />
        </Sequence>
      ))}
      {edl.music ? <Audio src={url(edl.music.src)} startFrom={Math.round((edl.music.startFrom ?? 0) * fps)} volume={edl.music.volume ?? 0.35} /> : null}
    </AbsoluteFill>
  );
};
