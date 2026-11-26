// EDL-driven montage: hard cuts, beat-snapped pacing, transitions (flash / whip / zoom-punch),
// continuous push-in so the camera is never still, optional speed ramps and J-cuts (audio leads picture).
import React from 'react';
import {AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Broll3D, type BrollProps} from '../broll3d/Broll3D';
import {TajawalCaptions, type CaptionWord} from '../captions/TajawalCaptions';
import {Fonts} from '../fonts';

export type EdlClip = {
  src: string;            // file under public/ (e.g. "montage-sample/a.mp4") or absolute URL
  in?: number;            // seconds into the source
  dur: number;            // seconds on the timeline
  speed?: number;         // playback speed (default 1)
  transition?: 'cut' | 'flash' | 'whip' | 'zoom';  // transition INTO this clip
  push?: number;          // push-in amount over the shot, e.g. 0.06 (default 0.05, 0 disables)
  jcut?: number;          // seconds this clip's audio starts before its picture
  volume?: number;
  zoom?: number;          // base punch-in scale for this shot (jump-cut look), e.g. 1.12
};
/** 3D B-roll cutaway over the timeline (picture only: the clips' audio keeps playing underneath). at/dur in timeline seconds. */
export type Overlay = BrollProps & {at: number; dur: number};
export type Edl = {clips: EdlClip[]; overlays?: Overlay[]; captions?: CaptionWord[][]; music?: {src: string; volume?: number; startFrom?: number}};
export type MontageProps = {edl: Edl; silent?: boolean};

const TR_FRAMES = 8;
const url = (s: string) => (/^https?:|^file:/.test(s) ? s : staticFile(s));

/** Total timeline length in seconds. */
export const edlSeconds = (edl: Edl) => edl.clips.reduce((a, c) => a + c.dur, 0);

const ShotView: React.FC<{clip: EdlClip; frames: number}> = ({clip, frames}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const tr = clip.transition ?? 'cut';
  const push = clip.push ?? 0.05;
  const scale = (clip.zoom ?? 1) * (1 + push * (frame / Math.max(1, frames)));
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

const OverlayView: React.FC<{o: Overlay; frames: number}> = ({o, frames}) => {
  const frame = useCurrentFrame();
  const fin = Math.min(1, frame / 5); const fout = Math.min(1, (frames - frame) / 5);
  const a = Math.min(fin, fout);
  return <AbsoluteFill style={{opacity: a, transform: `scale(${1.06 - 0.06 * a})`}}><Broll3D kind={o.kind} text={o.text} sub={o.sub} items={o.items} /></AbsoluteFill>;
};
const Caps: React.FC<{chunks: CaptionWord[][]}> = ({chunks}) => {
  const {fps} = useVideoConfig(); const t = useCurrentFrame() / fps;
  const c = chunks.find((ch) => t >= ch[0].start - 0.03 && t < ch[ch.length - 1].end + 0.12);
  return c ? <TajawalCaptions words={c} kashida={1} bottom={430} fontSize={78} activeColor="#F5C451" /> : null;
};

export const Montage: React.FC<MontageProps> = ({edl, silent}) => {
  const {fps} = useVideoConfig();
  let t = 0;
  const parts = edl.clips.map((c, i) => {
    const start = Math.round(t * fps); const frames = Math.max(1, Math.round(c.dur * fps)); t += c.dur;
    const lead = Math.round((c.jcut ?? 0) * fps);
    return {c, i, start, frames, lead};
  });
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Fonts />
      {parts.map(({c, i, start, frames}) => (
        <Sequence key={`v${i}`} from={start} durationInFrames={frames}><ShotView clip={c} frames={frames} /></Sequence>
      ))}
      {(edl.overlays ?? []).map((o, i) => {
        const fr = Math.max(1, Math.round(o.dur * fps));
        return <Sequence key={`o${i}`} from={Math.round(o.at * fps)} durationInFrames={fr}><OverlayView o={o} frames={fr} /></Sequence>;
      })}
      {edl.captions ? <Caps chunks={edl.captions} /> : null}
      {silent ? null : parts.map(({c, i, start, frames, lead}) => (
        <Sequence key={`a${i}`} from={Math.max(0, start - lead)} durationInFrames={frames + lead}>
          <Audio src={url(c.src)} startFrom={Math.max(0, Math.round((c.in ?? 0) * fps) - lead)} playbackRate={c.speed ?? 1} volume={c.volume ?? 1} />
        </Sequence>
      ))}
      {!silent && edl.music ? <Audio src={url(edl.music.src)} startFrom={Math.round((edl.music.startFrom ?? 0) * fps)} volume={edl.music.volume ?? 0.35} /> : null}
    </AbsoluteFill>
  );
};
