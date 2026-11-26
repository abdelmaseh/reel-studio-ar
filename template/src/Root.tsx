import React from 'react';
import {Composition} from 'remotion';
import {DemoReel} from './demo/DemoReel';
import {Demo3D, DEMO3D_FRAMES} from './demo/Demo3D';
import {Montage, edlSeconds, type MontageProps} from './montage/Montage';
import sampleEdl from './montage/sample-edl.json';
import {Explainer} from './montage/Explainer';
import {StyleFrame} from './styleboard/StyleFrame';
import {StyleCard3D} from './demo/StyleCard3D';
import {ACTIVE_STYLE, type StyleName} from './styles';

// Studio contract: 1080x1920 vertical. Comp fps is 50; the delivery encode conforms
// the container to 60fps by default (scripts/render-reel.sh). Motion blur is baked at render time.
export const FPS = 50;

const STILL_DUR = 250;

export const Root: React.FC = () => (
  <>
    <Composition id="Demo" component={DemoReel} durationInFrames={STILL_DUR} fps={FPS} width={1080} height={1920} defaultProps={{styleName: ACTIVE_STYLE}} />
    {(['cinematic', 'gold', 'minimal', 'pop', 'vhs', '3d'] as StyleName[]).map((s) => (
      <Composition key={s} id={`Demo-${s}`} component={DemoReel} durationInFrames={STILL_DUR} fps={FPS} width={1080} height={1920} defaultProps={{styleName: s}} />
    ))}
    <Composition id="Demo3D" component={Demo3D} durationInFrames={DEMO3D_FRAMES} fps={FPS} width={1080} height={1920} />
    <Composition id="Montage" component={Montage} durationInFrames={Math.round(edlSeconds(sampleEdl as any) * FPS)} fps={FPS} width={1080} height={1920}
      defaultProps={{edl: sampleEdl} as MontageProps}
      calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.round(edlSeconds(props.edl) * FPS))})} />
    <Composition id="Montage30" component={Montage} durationInFrames={Math.round(edlSeconds(sampleEdl as any) * 30)} fps={30} width={1080} height={1920}
      defaultProps={{edl: sampleEdl} as MontageProps}
      calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.round(edlSeconds(props.edl) * 30))})} />
    <Composition id="Explainer" component={Explainer as any} durationInFrames={750} fps={30} width={1080} height={1920} defaultProps={{beats: [], captions: [], audio: "", total: 25} as any} />
    <Composition id="StyleFrame" component={StyleFrame} durationInFrames={1} fps={FPS} width={1080} height={1920} defaultProps={{id: '1'}} />
    <Composition id="StyleCard3D" component={StyleCard3D} durationInFrames={1} fps={FPS} width={1080} height={1920} />
  </>
);
