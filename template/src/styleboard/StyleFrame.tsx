// Reference style board: 10 professional short-form styles rendered as illustrative stills on our sample footage.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Fonts, ARABIC_FONT, ARABIC_FEATURES} from '../fonts';
import {Callout3D} from '../broll3d/Broll3D';
import {Grain, Vignette} from '../vendor/reel-studio/core/transitions';

const F = {fontFamily: ARABIC_FONT, fontFeatureSettings: ARABIC_FEATURES, direction: 'rtl' as const};
const BG = {doc: staticFile('styles-bg/bg_a.jpg'), host: staticFile('styles-bg/bg_b.jpg')};
const doc = 'DOC'; const host = 'HOST';
const stroke = (px: number, c = '#000') => ({WebkitTextStroke: `${px}px ${c}`, paintOrder: 'stroke fill' as const});
const Bg: React.FC<{src?: string; style?: React.CSSProperties}> = ({src = doc, style}) => <Img src={src === 'DOC' ? BG.doc : src === 'HOST' ? BG.host : src} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style}} />;
const Words: React.FC<{items: {t: string; c?: string; s?: number; bg?: string; r?: number}[]; size: number; y: number; sw?: number; gap?: number}> = ({items, size, y, sw = 0.15, gap = 0.26}) => (
  <div style={{position: 'absolute', left: 70, right: 70, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: size * gap, ...F, fontWeight: 900, fontSize: size, lineHeight: 1.3}}>
    {items.map((w, i) => <span key={i} style={{display: 'inline-block', color: w.c ?? '#fff', transform: `scale(${w.s ?? 1}) rotate(${w.r ?? 0}deg)`, background: w.bg, padding: w.bg ? `0 ${size * 0.2}px` : undefined, borderRadius: w.bg ? size * 0.25 : undefined, ...(w.bg ? {} : stroke(Math.round(size * sw))), textShadow: w.bg ? undefined : '0 8px 0 rgba(0,0,0,0.35)'}}>{w.t}</span>)}
  </div>
);
const Label: React.FC<{n: string; ar: string; en: string}> = ({n, ar, en}) => (
  <div style={{position: 'absolute', top: 36, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 22, background: 'rgba(8,10,24,0.88)', border: '3px solid #FFD23F', borderRadius: 60, padding: '14px 40px', ...F}}>
      <span style={{background: '#FFD23F', color: '#111', fontWeight: 900, fontSize: 52, borderRadius: 40, minWidth: 80, textAlign: 'center', padding: '0 14px'}}>{n}</span>
      <span style={{color: '#fff', fontWeight: 900, fontSize: 56}}>{ar}</span>
      <span style={{color: '#9fb0d8', fontWeight: 700, fontSize: 30, direction: 'ltr'}}>{en}</span>
    </div>
  </div>
);
const Wave: React.FC = () => <div style={{display: 'flex', alignItems: 'center', gap: 8, height: 140}}>{Array.from({length: 38}).map((_, i) => <div key={i} style={{width: 14, borderRadius: 7, height: 30 + Math.abs(Math.sin(i * 0.9) * 90) + (i % 5) * 4, background: i < 22 ? '#FFD23F' : 'rgba(255,255,255,0.35)'}} />)}</div>;

const V: Record<string, () => React.ReactElement> = {
  '1': () => (<><Bg style={{filter: 'contrast(1.06) saturate(1.1)'}} /><Words size={112} y={1080} items={[{t: 'ريل'}, {t: 'بجودة'}, {t: '٦٠', c: '#FFD23F', s: 1.25}, {t: 'فريم'}]} /><Vignette strength={0.35} /></>),
  '2': () => (<><Bg src={host} style={{filter: 'saturate(1.25) contrast(1.08)'}} />
    <Words size={190} y={980} sw={0.12} items={[{t: 'مش', c: '#fff', r: -4}, {t: 'احترافي!', c: '#3DFF7A', s: 1.12, r: 3}]} />
    <div style={{position: 'absolute', left: 90, top: 720, width: 150, height: 150, borderRadius: '50%', background: '#FF3B3B', border: '10px solid #fff', transform: 'rotate(-14deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...F, fontWeight: 900, fontSize: 110, color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,.5)'}}>!</div>
    <svg style={{position: 'absolute', right: 120, top: 760}} width={220} height={180} viewBox="0 0 220 180"><path d="M10 150 C 60 20, 140 20, 200 60" stroke="#FFD23F" strokeWidth="16" fill="none" strokeLinecap="round"/><path d="M200 60 l-48 -6 M200 60 l-14 44" stroke="#FFD23F" strokeWidth="16" strokeLinecap="round"/></svg></>),
  '3': () => (<><Bg /><AbsoluteFill style={{background: 'linear-gradient(transparent 55%, rgba(0,0,0,0.55))'}} />
    <Words size={104} y={1150} items={[{t: 'جودة'}, {t: 'مش', c: '#111', bg: '#FFD23F', s: 1.08}, {t: 'سرعة'}]} /></>),
  '4': () => (<><Bg src={host} style={{filter: 'sepia(0.28) contrast(1.12) saturate(0.85) brightness(0.92)', transform: 'scale(1.08)'}} /><Vignette strength={0.6} /><Grain opacity={0.12} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 330, background: '#000'}} /><div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 330, background: '#000'}} />
    <div style={{position: 'absolute', left: 70, bottom: 480, borderLeft: '8px solid #F5C451', paddingLeft: 28, ...F, direction: 'rtl', borderRight: 'none'}}><div style={{color: '#fff', fontWeight: 900, fontSize: 60}}>مخرج ريلز</div><div style={{color: '#F5C451', fontWeight: 700, fontSize: 38}}>استوديو سيحا</div></div>
    <div style={{position: 'absolute', left: 80, right: 80, bottom: 150, textAlign: 'center', color: '#fff', ...F, fontWeight: 700, fontSize: 50, textShadow: '0 2px 12px #000'}}>ريل بريميوم في أمر واحد</div></>),
  '5': () => (<AbsoluteFill style={{background: 'linear-gradient(180deg,#0b1020,#151c3a)'}}>
    <div style={{position: 'absolute', left: 40, right: 40, top: 150, height: 1000, borderRadius: 44, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.6)'}}><Bg style={{objectPosition: '50% 20%'}} /></div>
    <div style={{position: 'absolute', left: 40, right: 40, top: 1180, ...F}}>
      <div style={{color: '#FFD23F', fontWeight: 900, fontSize: 38, letterSpacing: 0}}>ريل | استوديو الريلز</div>
      <div style={{color: '#fff', fontWeight: 900, fontSize: 62, marginTop: 6}}>جاهز ولا لسه؟</div>
      <div style={{marginTop: 26, display: 'flex', justifyContent: 'center'}}><Wave /></div>
      <div style={{marginTop: 20, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.25)'}}><div style={{width: '42%', height: '100%', borderRadius: 6, background: '#FFD23F', marginLeft: 'auto'}} /></div>
      <div style={{display: 'flex', justifyContent: 'space-between', color: '#9fb0d8', fontWeight: 700, fontSize: 30, marginTop: 10, direction: 'ltr'}}><span>0:21</span><span>0:48</span></div></div></AbsoluteFill>),
  '6': () => (<><Bg style={{filter: 'brightness(0.35) blur(6px)'}} /><AbsoluteFill style={{...F, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', gap: 0}}>
    <div style={{fontWeight: 900, fontSize: 130, color: '#fff', lineHeight: 1.1}}>مش</div><div style={{fontWeight: 900, fontSize: 360, color: '#FFD23F', lineHeight: 1}}>سرعة</div><div style={{fontWeight: 900, fontSize: 200, color: '#2DD4BF', lineHeight: 1.1}}>جودة</div><div style={{fontWeight: 900, fontSize: 90, color: '#fff', opacity: 0.8}}>٦٠ فريم في الثانية</div></AbsoluteFill></>),
  '7': () => (<AbsoluteFill style={{background: '#000'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 960, overflow: 'hidden'}}><Bg src={host} style={{objectPosition: '50% 18%'}} /></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 960, height: 960, overflow: 'hidden'}}><Bg src={doc} style={{objectPosition: '50% 18%'}} /></div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 950, height: 20, background: '#FFD23F'}} />
    <Words size={90} y={880} items={[{t: 'دي', c: '#111', bg: '#FFD23F'}, {t: 'احترافي؟'}]} /></AbsoluteFill>),
  '8': () => (<><Bg /><div style={{position: 'absolute', top: 190, left: 60, right: 60, height: 12, borderRadius: 6, background: 'rgba(255,255,255,.3)'}}><div style={{width: '35%', height: '100%', borderRadius: 6, background: '#FFD23F', marginLeft: 'auto'}} /></div>
    <div style={{position: 'absolute', top: 240, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}><div style={{background: '#fff', borderRadius: 36, padding: '12px 46px', ...F, fontWeight: 900, fontSize: 80, color: '#111', boxShadow: '0 12px 0 #FFD23F'}}>جاهز ولا لسه؟</div></div>
    <div style={{position: 'absolute', top: 390, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14, ...F}}>{['١', '٢', '٣'].map((n, i) => <div key={n} style={{width: 70, height: 70, borderRadius: 35, background: i === 0 ? '#FFD23F' : 'rgba(0,0,0,.5)', color: i === 0 ? '#111' : '#fff', fontWeight: 900, fontSize: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff'}}>{n}</div>)}</div>
    <Words size={100} y={1150} items={[{t: 'جودة', c: '#FFD23F'}, {t: 'مش'}, {t: 'سرعة'}]} /><Vignette strength={0.3} /></>),
  '9': () => (<><Bg /><AbsoluteFill style={{background: 'linear-gradient(rgba(5,7,15,0.7), transparent 25%)'}} /><div style={{position: 'absolute', inset: 0}}><Callout3D kind="chips" text="" items={['كبد دهني', 'كوليسترول', 'دهون ثلاثية']} /></div>
    <Words size={100} y={1150} items={[{t: 'بتتصور'}, {t: 'بجودة', c: '#FFD23F'}, {t: 'عالية'}]} /></>),
  '10': () => (<><Bg src={doc} />
    <div style={{position: 'absolute', inset: 0, clipPath: 'polygon(50% 0,100% 0,100% 100%,50% 100%)'}}><Bg src={doc} style={{filter: 'contrast(1.18) saturate(1.25) hue-rotate(-8deg) brightness(0.95)'}} /><AbsoluteFill style={{background: 'linear-gradient(160deg, rgba(0,120,140,0.28), rgba(255,140,40,0.18))', mixBlendMode: 'soft-light'}} /></div>
    <div style={{position: 'absolute', left: 538, top: 0, bottom: 0, width: 4, background: '#fff'}} />
    <div style={{position: 'absolute', top: 1500, left: 60, ...F, fontWeight: 900, fontSize: 46, color: '#fff', background: 'rgba(0,0,0,.6)', padding: '4px 22px', borderRadius: 20}}>قبل</div>
    <div style={{position: 'absolute', top: 1500, right: 60, ...F, fontWeight: 900, fontSize: 46, color: '#111', background: '#FFD23F', padding: '4px 22px', borderRadius: 20}}>بعد التلوين</div><Vignette strength={0.45} /><Grain opacity={0.1} /></>),
};
const META: Record<string, [string, string]> = {'1': ['كابشن هورموزي', 'Hormozi captions'], '2': ['ستايل ميستر بيست', 'MrBeast pop'], '3': ['كابشن كاريوكي', 'Karaoke highlight'], '4': ['وثائقي سينمائي', 'Documentary + lower third'], '5': ['كليب بودكاست', 'Podcast clip + waveform'], '6': ['تايبوجرافي متحرك', 'Kinetic typography'], '7': ['شاشة منقسمة', 'Split screen'], '8': ['هوك + شريط تقدم', 'Hook + progress bar'], '9': ['جرافيك ثلاثي الأبعاد', '3D callouts'], '10': ['تلوين سينمائي', 'Color grade before/after']};
export const StyleFrame: React.FC<{id: string; bgDoc?: string; bgHost?: string}> = ({id, bgDoc, bgHost}) => {
  BG.doc = bgDoc ? staticFile(bgDoc) : staticFile('styles-bg/bg_a.jpg'); BG.host = bgHost ? staticFile(bgHost) : staticFile('styles-bg/bg_b.jpg');
  const [ar, en] = META[id]; const n = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '١٠'][Number(id) - 1];
  return <AbsoluteFill style={{background: '#000'}}><Fonts />{V[id]()}<Label n={n} ar={ar} en={en} /></AbsoluteFill>;
};
