// 5-second studio proof reel, driven by a named style from src/styles.ts.
// Proves: @remotion/motion-blur, kashida captions, transitions-v4, whip-pan + light scan,
// audio-reactive bands, grain/vignette. SFX are mixed in post (scripts/render-reel.sh).
import React from 'react';
import {AbsoluteFill, continueRender, delayRender, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraBlur} from '../vendor/reel-studio/core/mblur';
import {WhipPan, LightScan} from '../vendor/reel-studio/core/whip';
import {PageTurn} from '../vendor/reel-studio/core/transitions-v4/page-turn';
import {InkSlab} from '../vendor/reel-studio/core/transitions-v4/ink-slab';
import {Iris} from '../vendor/reel-studio/core/transitions-v4/iris';
import {DotZoom} from '../vendor/reel-studio/core/transitions-v4/dot-zoom';
import {ZoomThrough} from '../vendor/reel-studio/core/transitions-v4/zoom-through';
import {Blinds} from '../vendor/reel-studio/core/transitions-v4/blinds';
import {Grain, Vignette, FlashBloom} from '../vendor/reel-studio/core/transitions';
import {useBands} from '../vendor/reel-studio/core/audioviz';
import {TajawalCaptions} from '../captions/TajawalCaptions';
import {Fonts, ARABIC_FONT} from '../fonts';
import {STYLES, ACTIVE_STYLE, type StyleName} from '../styles';

const LAND = 34; // landing frame of the hero card
const CUT = 90; // transition frame
const TRANSITION_DUR = 16;

const Card: React.FC<{title: string; sub: string; accent: string; bg: string; border: string; subColor: string}> = ({title, sub, accent, bg, border, subColor}) => (
  <div
    style={{
      width: 760,
      borderRadius: 42,
      padding: '64px 56px',
      background: bg,
      boxShadow: `0 60px 120px rgba(0,0,0,0.35), inset 0 0 0 2px ${border}`,
      fontFamily: ARABIC_FONT,
      direction: 'rtl',
      textAlign: 'center',
    }}
  >
    <div style={{color: accent, fontSize: 88, fontWeight: 900, lineHeight: 1.3}}>{title}</div>
    <div style={{color: subColor, fontSize: 44, fontWeight: 700, marginTop: 18}}>{sub}</div>
  </div>
);

const Bands: React.FC<{accent: string; accent2: string}> = ({accent, accent2}) => {
  const bands = useBands(staticFile('audio/demo-bed.wav'), 28, {band: 'full', smoothing: 0.4});
  return (
    <div style={{position: 'absolute', bottom: 240, left: 90, right: 90, height: 160, display: 'flex', alignItems: 'flex-end', gap: 8, direction: 'ltr'}}>
      {bands.map((b, i) => (
        <div key={i} style={{flex: 1, height: `${Math.max(4, Math.min(100, b * 130))}%`, borderRadius: 6, background: `linear-gradient(180deg,${accent},${accent2})`, opacity: 0.9}} />
      ))}
    </div>
  );
};

/** The style's default transition, mounted over the cut at CUT. */
// Overlay transitions (page-turn) sit on top of the cut; entrance transitions wrap the
// incoming scene as children and reveal it themselves.
const OVERLAY: Set<string> = new Set(['page-turn']);

const StyleTransition: React.FC<{style: StyleName; children?: React.ReactNode}> = ({style, children}) => {
  const {fps} = useVideoConfig();
  const s = STYLES[style];
  const p = {atFrame: CUT, durationInFrames: TRANSITION_DUR, fps};
  switch (s.transition) {
    case 'page-turn':
      return <PageTurn {...p} paper={s.transitionPaper ?? '#141a26'} />;
    case 'ink-slab':
      return <InkSlab {...p}>{children}</InkSlab>;
    case 'iris':
      return <Iris {...p}>{children}</Iris>;
    case 'dot-zoom':
      return <DotZoom {...p}>{children}</DotZoom>;
    case 'zoom-through':
      return <ZoomThrough {...p}>{children}</ZoomThrough>;
    case 'blinds':
      return <Blinds {...p}>{children}</Blinds>;
  }
};

export const DemoReel: React.FC<{styleName?: StyleName}> = ({styleName}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = STYLES[styleName ?? ACTIVE_STYLE];

  const drop = spring({frame, fps, config: {damping: 11, stiffness: 95, mass: 1.4}});
  const y = -1100 * (1 - drop);
  const airborne = Math.min(1, Math.max(0, -y / 1100));
  const shadowScale = 1 - airborne * 0.55;
  const shadowAlpha = 0.55 - airborne * 0.38;

  const scene2 = (
    <>
      <WhipPan dir="rtl" at={CUT + 6} durF={8} distance={320}>
        <div style={{position: 'absolute', left: 160, top: 560}}>
          <Card title="بلور + كشيدة + انتقالات" sub="كلها متجربة دلوقتي" accent={s.accent2} bg={s.cardBg} border={s.cardBorder} subColor={s.cardSub} />
        </div>
      </WhipPan>
      <LightScan bounds={{x: 160, y: 560, width: 760, height: 480}} at={CUT + 38} durF={16} color="#FFFFFF" peak={0.5} blend="screen" />
      <Bands accent={s.accent} accent2={s.accent2} />
    </>
  );

  return (
    <AbsoluteFill style={{background: s.bg1}}>
      <Fonts />

      {/* Scene 1: hero card gravity drop with real motion blur */}
      {frame < CUT + TRANSITION_DUR ? (
        <AbsoluteFill>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 1230,
              width: 560 * shadowScale,
              height: 74,
              transform: 'translateX(-50%)',
              borderRadius: '50%',
              background: `rgba(0,0,0,${shadowAlpha})`,
              filter: 'blur(28px)',
            }}
          />
          <div style={{position: 'absolute', left: 160, top: 560, transform: `translateY(${y}px)`}}>
            <CameraBlur shutter="film180">
              <Card title="الستوديو اتجمّع" sub="ريل بأعلى جودة، من باكدج واحدة" accent={s.accent} bg={s.cardBg} border={s.cardBorder} subColor={s.cardSub} />
            </CameraBlur>
          </div>
          <FlashBloom at={LAND / fps} peak={0.35} />
        </AbsoluteFill>
      ) : null}

      {/* Scene 2: whipped-in spec card + sheen + audio-reactive bands.
          Entrance transitions get it as children; overlay transitions sit above it. */}
      {frame >= CUT ? (
        <AbsoluteFill style={{background: s.bg2}}>
          {OVERLAY.has(s.transition) ? (
            <>{scene2}</>
          ) : (
            <StyleTransition style={styleName ?? ACTIVE_STYLE}>{scene2}</StyleTransition>
          )}
        </AbsoluteFill>
      ) : null}
      {frame >= CUT && OVERLAY.has(s.transition) ? <StyleTransition style={styleName ?? ACTIVE_STYLE} /> : null}

      <TajawalCaptions
        kashida={s.captions.kashida}
        bottom={430}
        color={s.captions.color}
        activeColor={s.captions.activeColor}
        dimColor={s.captions.dimColor}
        activePill={s.captions.activePill}
        words={[
          {text: 'دي', start: 0.3, end: 0.62},
          {text: 'أول', start: 0.62, end: 0.95},
          {text: 'تجربة', start: 0.95, end: 1.45},
          {text: 'للستوديو', start: 2.7, end: 3.25},
          {text: 'المتكامل', start: 3.25, end: 3.9},
          {text: 'بتاعنا', start: 3.9, end: 4.5},
        ]}
      />

      {s.grain > 0 ? <Grain opacity={s.grain} /> : null}
      {s.vignette > 0 ? <Vignette strength={s.vignette} /> : null}
    </AbsoluteFill>
  );
};
