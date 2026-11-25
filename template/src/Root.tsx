import React from 'react';
import {Composition} from 'remotion';
import {DemoReel} from './demo/DemoReel';
import {ACTIVE_STYLE, type StyleName} from './styles';

// Studio contract: 1080x1920 vertical. Comp fps is 50; the delivery encode conforms
// the container to 200fps (scripts/render-reel.sh). Motion blur is baked at render time.
export const FPS = 50;

const STILL_DUR = 250;

export const Root: React.FC = () => (
  <>
    <Composition id="Demo" component={DemoReel} durationInFrames={STILL_DUR} fps={FPS} width={1080} height={1920} defaultProps={{styleName: ACTIVE_STYLE}} />
    {(['cinematic', 'gold', 'minimal', 'pop', 'vhs'] as StyleName[]).map((s) => (
      <Composition key={s} id={`Demo-${s}`} component={DemoReel} durationInFrames={STILL_DUR} fps={FPS} width={1080} height={1920} defaultProps={{styleName: s}} />
    ))}
  </>
);
