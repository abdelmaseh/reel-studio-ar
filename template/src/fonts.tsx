// Arabic type system for the studio. Default face: Cairo (variable 200-1000, OFL): full weight range up to Black,
// clean tatweel joins, properly stacked tashkeel. Tajawal stays as fallback; IBM Plex Sans Arabic and Almarai are
// optional alternates (see RUNBOOK "الخطوط"). Files are fetched by INSTALL.sh into public/fonts.
import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

export const ARABIC_FONT = "'Cairo', 'Tajawal', sans-serif";
export const ARABIC_FONTS = {cairo: "'Cairo', 'Tajawal', sans-serif", tajawal: "'Tajawal', sans-serif", plex: "'IBMPlexArabic', 'Cairo', sans-serif", almarai: "'Almarai', 'Cairo', sans-serif"} as const;
/** OpenType features that matter for Arabic in video: contextual alternates, ligatures, mark positioning. */
export const ARABIC_FEATURES = '"ccmp" 1, "locl" 1, "calt" 1, "liga" 1, "rlig" 1, "mark" 1, "mkmk" 1, "kern" 1';

const FONT_CSS = `
@font-face{font-family:'Cairo';src:url('${staticFile('fonts/Cairo.ttf')}') format('truetype');font-weight:200 1000;}
@font-face{font-family:'Tajawal';src:url('${staticFile('fonts/Tajawal-Regular.ttf')}') format('truetype');font-weight:400;}
@font-face{font-family:'Tajawal';src:url('${staticFile('fonts/Tajawal-Bold.ttf')}') format('truetype');font-weight:700;}
@font-face{font-family:'Tajawal';src:url('${staticFile('fonts/Tajawal-ExtraBold.ttf')}') format('truetype');font-weight:800;}
@font-face{font-family:'IBMPlexArabic';src:url('${staticFile('fonts/IBMPlexSansArabic-Bold.ttf')}') format('truetype');font-weight:700;}
@font-face{font-family:'Almarai';src:url('${staticFile('fonts/Almarai-ExtraBold.ttf')}') format('truetype');font-weight:800;}
`;

/** Mount once per composition: registers all faces and blocks the render until they are decoded. */
export const Fonts: React.FC = () => {
  const [h] = React.useState(() => delayRender('loading Arabic fonts'));
  React.useEffect(() => {
    const st = document.createElement('style');
    st.textContent = FONT_CSS;
    document.head.appendChild(st);
    Promise.all(['900 64px Cairo', '700 64px Cairo', '800 64px Tajawal'].map((f) => document.fonts.load(f, 'تحوّل مُحَمَّدٌ'))).then(() => continueRender(h), () => continueRender(h));
  }, [h]);
  return null;
};
