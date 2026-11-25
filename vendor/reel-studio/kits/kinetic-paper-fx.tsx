// Extracted from reel-studio `engine/src/styles/kinetic-paper/designs/kit.tsx`
// (Apache-2.0, https://github.com/mohamedabdou-ai/reel-studio). Only what ink-slab needs:
// the ink/lime tokens and the paper-tooth/fibre/speck grain overlays.
import React from 'react';

export const INK = '#15231F';
export const LIME = '#DDF25E';

/** Paper texture: tooth + fibre multiply overlays and near-white speckle. */
export const PaperFx: React.FC<{style?: React.CSSProperties}> = ({style}) => <>
  <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: 0.07, pointerEvents: 'none', ...style}}>
    <filter id="kp-tooth" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="23"/>
      <feColorMatrix type="matrix" values="1.6 0 0 0 -0.05  1.6 0 0 0 -0.05  1.6 0 0 0 -0.05  0 0 0 0 1"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#kp-tooth)"/>
  </svg>
  <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: 0.04, pointerEvents: 'none', ...style}}>
    <filter id="kp-fibre" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.02 0.35" numOctaves="2" seed="11"/>
      <feColorMatrix type="matrix" values="2.2 0 0 0 -0.35  2.2 0 0 0 -0.35  2.2 0 0 0 -0.35  0 0 0 0 1"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#kp-fibre)"/>
  </svg>
  <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.92, pointerEvents: 'none', ...style}}>
    <filter id="kp-speck" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="5"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.965  0 0 0 0 0.945  0 0 0 0 0.91  26 0 0 0 -18.4"/>
    </filter>
    <rect width="100%" height="100%" filter="url(#kp-speck)"/>
  </svg>
</>;
