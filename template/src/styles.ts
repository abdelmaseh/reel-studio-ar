// Named visual styles for the studio — one constant switches the whole reel's look.
// Concept adapted from video-ad-editor's styles bank (MIT, https://github.com/majedphotos/video-ad-editor);
// these five presets are our own, tuned for Arabic ad reels.
import type {CaptionWord} from './captions/TajawalCaptions';

export type StyleName = 'cinematic' | 'gold' | 'minimal' | 'pop' | 'vhs' | '3d';

export type ReelStyle = {
  /** one-line Arabic description for the runbook */
  ar: string;
  bg1: string;
  bg2: string;
  accent: string;
  accent2: string;
  cardBg: string;
  cardBorder: string;
  cardSub: string;
  captions: {
    color: string;
    activeColor: string;
    dimColor: string;
    activePill: string | null;
    kashida: number;
    fontSize?: number;
  };
  /** default transition out of the ported pack */
  transition: 'page-turn' | 'ink-slab' | 'iris' | 'dot-zoom' | 'zoom-through' | 'blinds';
  transitionPaper?: string;
  grain: number;
  vignette: number;
  /** default SFX flavor: catalog names in assets/sfx/catalog.json */
  sfx: {impact: string; whoosh: string; sting: string; note: string};
};

export const STYLES: Record<StyleName, ReelStyle> = {
  cinematic: {
    ar: 'سينمائي غامق تيل/أورانج — الشكل الحالي بتاعنا، ينفع لأي إعلان بريميوم',
    bg1: 'radial-gradient(120% 90% at 50% 30%, #1b2436 0%, #0a0d14 70%)',
    bg2: 'radial-gradient(120% 90% at 50% 70%, #231a2e 0%, #0b0a12 72%)',
    accent: '#64E4FF',
    accent2: '#FF9E4D',
    cardBg: 'linear-gradient(160deg, #171e2b 0%, #0d1119 100%)',
    cardBorder: '#64E4FF55',
    cardSub: 'rgba(255,255,255,0.72)',
    captions: {color: '#FFFFFF', activeColor: '#FFD34D', dimColor: 'rgba(255,255,255,0.38)', activePill: 'rgba(0,0,0,0.45)', kashida: 2},
    transition: 'page-turn',
    transitionPaper: '#141a26',
    grain: 0.05,
    vignette: 0.4,
    sfx: {impact: 'trailer_hit_1', whoosh: 'whoosh_big_1', sting: 'braam_1', note: 'ضربات سينمائية تقيلة + ووش هوائي قبل كل حركة'},
  },
  gold: {
    ar: 'فخامة دهبي/أسود — عقارات وساعات وبراندات غالية',
    bg1: 'radial-gradient(120% 90% at 50% 28%, #241b08 0%, #0a0804 68%)',
    bg2: 'radial-gradient(120% 90% at 50% 72%, #1c1507 0%, #080603 72%)',
    accent: '#E8C468',
    accent2: '#B98A2E',
    cardBg: 'linear-gradient(160deg, #191408 0%, #0c0904 100%)',
    cardBorder: '#E8C46866',
    cardSub: 'rgba(245,237,216,0.7)',
    captions: {color: '#F5EDD8', activeColor: '#E8C468', dimColor: 'rgba(245,237,216,0.35)', activePill: 'rgba(0,0,0,0.55)', kashida: 2},
    transition: 'ink-slab',
    grain: 0.04,
    vignette: 0.5,
    sfx: {impact: 'trailer_hit_1', whoosh: 'whoosh_air_1', sting: 'braam_2', note: 'هيتز عميقة ومكتومة، مفيش حاجة حادة — الفخامة هادية'},
  },
  minimal: {
    ar: 'نضيف فاتح مينيمال — تك وSaaS وعروض أسعار، كل التركيز على الكلام',
    bg1: 'linear-gradient(180deg, #F7F6F2 0%, #EFEEE8 100%)',
    bg2: 'linear-gradient(180deg, #F2F3F5 0%, #E9EBEE 100%)',
    accent: '#3563FF',
    accent2: '#12C4DC',
    cardBg: 'linear-gradient(160deg, #FFFFFF 0%, #F6F7F9 100%)',
    cardBorder: '#14181F14',
    cardSub: 'rgba(20,24,31,0.62)',
    captions: {color: '#14181F', activeColor: '#3563FF', dimColor: 'rgba(20,24,31,0.35)', activePill: 'rgba(255,255,255,0.75)', kashida: 1},
    transition: 'zoom-through',
    grain: 0,
    vignette: 0.1,
    sfx: {impact: 'ding_1', whoosh: 'whoosh_air_2', sting: 'ding_2', note: 'دينجز نضيفة خفيفة، ممنوع هيتز تقيلة'},
  },
  pop: {
    ar: 'بوب صاخب ألوان قوية — عروض وخصومات ومحتوى ترند، طاقة عالية',
    bg1: 'linear-gradient(150deg, #7B5CFF 0%, #FF5C8A 55%, #FF9E4D 100%)',
    bg2: 'linear-gradient(150deg, #3563FF 0%, #7B5CFF 50%, #FF5C8A 100%)',
    accent: '#FFD34D',
    accent2: '#64E4FF',
    cardBg: 'linear-gradient(160deg, #22124D 0%, #12082E 100%)',
    cardBorder: '#FFD34D77',
    cardSub: 'rgba(255,255,255,0.78)',
    captions: {color: '#FFFFFF', activeColor: '#FFD34D', dimColor: 'rgba(255,255,255,0.45)', activePill: 'rgba(255,92,138,0.85)', kashida: 1},
    transition: 'dot-zoom',
    grain: 0.03,
    vignette: 0.22,
    sfx: {impact: 'ding_3', whoosh: 'whoosh_fast_1', sting: 'bell_small_1', note: 'ووشات سريعة ودينجز مرحة على الإيقاع'},
  },
  '3d': {
    ar: 'ثري دي احترافي — طاقة البوب بس بعمق حقيقي: منظور، طبقات parallax، ضلال ناعمة، عناصر طايرة وبلور عمق، ونص بسمك',
    bg1: 'radial-gradient(110% 80% at 50% 35%, #8A63FF 0%, #5B33E6 45%, #2A136F 100%)',
    bg2: 'radial-gradient(110% 80% at 50% 65%, #FF6A9A 0%, #B13DD6 45%, #3A1580 100%)',
    accent: '#FFD34D',
    accent2: '#64E4FF',
    cardBg: 'linear-gradient(160deg, #FFFFFF 0%, #E9E2FF 100%)',
    cardBorder: 'rgba(255,255,255,0.5)',
    cardSub: 'rgba(34,18,77,0.75)',
    captions: {color: '#FFFFFF', activeColor: '#FFD34D', dimColor: 'rgba(255,255,255,0.5)', activePill: 'rgba(42,19,111,0.75)', kashida: 1},
    transition: 'dot-zoom',
    grain: 0.03,
    vignette: 0.3,
    sfx: {impact: 'ding_3', whoosh: 'whoosh_fast_1', sting: 'bell_small_1', note: 'ووشات سريعة + ضربات خفيفة مع كل دخول 3D'},
  },
  vhs: {
    ar: 'جريتي VHS/بروتاليست — للهوك وأول ثانيتين، شكل خام متعمد',
    bg1: 'linear-gradient(180deg, #111111 0%, #0A0A0A 100%)',
    bg2: 'linear-gradient(180deg, #141414 0%, #0B0B0B 100%)',
    accent: '#DDF25E',
    accent2: '#FF4D4D',
    cardBg: '#101010',
    cardBorder: '#DDF25E',
    cardSub: 'rgba(255,255,255,0.6)',
    captions: {color: '#EDEDED', activeColor: '#DDF25E', dimColor: 'rgba(255,255,255,0.3)', activePill: '#000000', kashida: 0},
    transition: 'blinds',
    grain: 0.12,
    vignette: 0.55,
    sfx: {impact: 'glitch_1', whoosh: 'whoosh_fast_2', sting: 'glitch_2', note: 'جليتش وتشويش — التقطيع نفسه جزء من الشكل'},
  },
};

/** The one switch: scenes read their style from here unless a composition overrides it in defaultProps. */
export const ACTIVE_STYLE: StyleName = 'cinematic';

export type {CaptionWord};
