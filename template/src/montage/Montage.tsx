// EDL-driven montage: hard cuts, beat-snapped pacing, transitions (flash / whip / zoom-punch),
// continuous push-in so the camera is never still, optional speed ramps and J-cuts (audio leads picture).
import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, spring, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Broll3D, Callout3D, type BrollProps, type CalloutProps} from '../broll3d/Broll3D';
import {BeastCaptions} from '../captions/BeastCaptions';
import {PunchCaptions} from '../captions/PunchCaptions';
import {TajawalCaptions, type CaptionWord} from '../captions/TajawalCaptions';
import {Fonts, ARABIC_FONT} from '../fonts';
import {Text3D} from '../vendor/reel-studio/kits/depth3d';

export type EdlClip = {
  src: string;            // file under public/ (e.g. "montage-sample/a.mp4") or absolute URL
  in?: number;            // seconds into the source
  dur: number;            // seconds on the timeline
  speed?: number;         // playback speed (default 1)
  transition?: 'cut' | 'flash' | 'whip' | 'zoom';  // transition INTO this clip
  push?: number;          // push-in amount over the shot, e.g. 0.06 (default 0.05, 0 disables)
  jcut?: number;          // seconds this clip's audio starts before its picture
  volume?: number;
  origin?: string;        // CSS transform-origin for zoom/push (keep the face stable), default '50% 30%'
  behind?: {text: string; sub?: string; seq: string; n: number; size?: number; y?: number; x?: number; color?: string}; // text BETWEEN the room and the matted speaker (person PNG sequence in public/<seq>/%04d.png)
  zoom?: number;          // base punch-in scale for this shot (jump-cut look), e.g. 1.12
};
/** 3D B-roll cutaway over the timeline (picture only: the clips' audio keeps playing underneath). at/dur in timeline seconds. */
export type Overlay = (BrollProps | CalloutProps) & {at: number; dur: number};
export type Edl = {clips: EdlClip[]; overlays?: Overlay[]; captions?: CaptionWord[][]; captionStyle?: 'tajawal' | 'punch' | 'beast'; grade?: 'cinematic'; progress?: boolean; music?: {src: string; volume?: number; startFrom?: number}};
export type MontageProps = {edl: Edl; silent?: boolean};

const TR_FRAMES = 8;
const url = (s: string) => (/^https?:|^file:/.test(s) ? s : staticFile(s));

/** Total timeline length in seconds. */
export const edlSeconds = (edl: Edl) => edl.clips.reduce((a, c) => a + c.dur, 0);

const BehindLayers: React.FC<{b: NonNullable<EdlClip['behind']>}> = ({b}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const p = spring({frame: f - 2, fps, config: {damping: 13, stiffness: 140, mass: 0.7}});
  const idx = String(Math.min(b.n, f + 1)).padStart(4, '0');
  return (<>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: b.y ?? 260, opacity: Math.min(1, p * 2.5), transform: `translateX(${b.x ?? 0}px) scale(${0.7 + 0.3 * p}) translateY(${(1 - p) * 60}px)`}}>
      <Text3D text={b.text} size={b.size ?? 520} face={b.color ?? '#FFD23F'} side="#9A6A12" depth={36} angle={74} style={{position: 'relative', width: 1000}} />
      {b.sub ? <div style={{fontFamily: ARABIC_FONT, fontWeight: 900, fontSize: 150, color: '#fff', marginTop: -40, textShadow: '0 8px 30px rgba(0,0,0,.5)', direction: 'rtl'}}>{b.sub}</div> : null}
    </AbsoluteFill>
    <Img src={staticFile(`${b.seq}/${idx}.png`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
  </>);
};

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
      <AbsoluteFill style={{transform, filter, transformOrigin: clip.origin ?? '50% 30%'}}>
        <OffthreadVideo src={url(clip.src)} startFrom={Math.round((clip.in ?? 0) * fps)} playbackRate={clip.speed ?? 1} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      {clip.behind ? <BehindLayers b={clip.behind} /> : null}
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{background: '#fff', opacity: flash}} /> : null}
    </AbsoluteFill>
  );
};

const OverlayView: React.FC<{o: Overlay; frames: number}> = ({o, frames}) => {
  const frame = useCurrentFrame();
  const fin = Math.min(1, frame / 5); const fout = Math.min(1, (frames - frame) / 5);
  const a = Math.min(fin, fout);
  if (o.kind === 'headline' || o.kind === 'num' || o.kind === 'chips') return <AbsoluteFill style={{opacity: a}}><Callout3D kind={o.kind} text={o.text} items={(o as any).items} /></AbsoluteFill>;
  const b = o as BrollProps;
  return <AbsoluteFill style={{opacity: a, transform: `scale(${1.06 - 0.06 * a})`}}><Broll3D kind={b.kind} text={b.text} sub={b.sub} items={b.items} /></AbsoluteFill>;
};
const Caps: React.FC<{chunks: CaptionWord[][]; style?: string}> = ({chunks, style}) => {
  const {fps} = useVideoConfig(); const t = useCurrentFrame() / fps;
  const c = chunks.find((ch) => t >= ch[0].start - 0.03 && t < ch[ch.length - 1].end + 0.12);
  if (c && style === 'punch') return <PunchCaptions words={c} />;
  if (c && style === 'beast') return <BeastCaptions words={c} />;
  return c ? <TajawalCaptions words={c} kashida={1} bottom={430} fontSize={78} activeColor="#F5C451" /> : null;
};

const ProgressBar: React.FC<{total: number}> = ({total}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  return <div style={{position: 'absolute', top: 96, left: 60, right: 60, height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.28)'}}><div style={{width: `${Math.min(100, (f / fps / total) * 100)}%`, height: '100%', borderRadius: 6, background: '#FFD23F', marginLeft: 'auto'}} /></div>;
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
      <AbsoluteFill style={edl.grade === 'cinematic' ? {filter: 'contrast(1.14) saturate(1.18) brightness(0.97)'} : undefined}>
      {parts.map(({c, i, start, frames}) => (
        <Sequence key={`v${i}`} from={start} durationInFrames={frames}><ShotView clip={c} frames={frames} /></Sequence>
      ))}
      </AbsoluteFill>
      {edl.grade === 'cinematic' ? (<>
        <AbsoluteFill style={{mixBlendMode: 'soft-light', background: 'linear-gradient(180deg,#0e7c8a 0%,#2a3f66 45%,#ff8a3c 100%)', opacity: 0.6}} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />
      </>) : null}
      {(edl.overlays ?? []).map((o, i) => {
        const fr = Math.max(1, Math.round(o.dur * fps));
        return <Sequence key={`o${i}`} from={Math.round(o.at * fps)} durationInFrames={fr}><OverlayView o={o} frames={fr} /></Sequence>;
      })}
      {edl.progress ? <ProgressBar total={edlSeconds(edl)} /> : null}
      {edl.captions ? <Caps chunks={edl.captions} style={edl.captionStyle} /> : null}
      {silent ? null : parts.map(({c, i, start, frames, lead}) => (
        <Sequence key={`a${i}`} from={Math.max(0, start - lead)} durationInFrames={frames + lead}>
          <Audio src={url(c.src)} startFrom={Math.max(0, Math.round((c.in ?? 0) * fps) - lead)} playbackRate={c.speed ?? 1} volume={c.volume ?? 1} />
        </Sequence>
      ))}
      {!silent && edl.music ? <Audio src={url(edl.music.src)} startFrom={Math.round((edl.music.startFrom ?? 0) * fps)} volume={edl.music.volume ?? 0.35} /> : null}
    </AbsoluteFill>
  );
};
