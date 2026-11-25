// Style card still for the "3d" preset (1080x1920): hero extruded type, slabs, floaters, contact shadows.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Stage3D, Layer, ContactShadow, Slab3D, Cube3D, Sphere3D, Ring3D, Text3D} from '../vendor/reel-studio/kits/depth3d';
import {Grain, Vignette} from '../vendor/reel-studio/core/transitions';
import {Fonts, ARABIC_FONT} from '../fonts';
import {STYLES} from '../styles';

const S = STYLES['3d'];
const C: React.FC<{children: React.ReactNode}> = ({children}) => <div style={{position: 'absolute', left: '50%', top: '50%', transformStyle: 'preserve-3d'}}>{children}</div>;
const Shadow: React.FC<{z: number; x: number; y: number; w: number}> = ({z, x, y, w}) => (
  <Layer z={z} x={x} y={y}><div style={{position: 'absolute', left: '50%', top: '50%', transform: 'rotateX(78deg)'}}><ContactShadow width={w} height={w * 0.5} lift={120} max={260} /></div></Layer>
);
export const StyleCard3D: React.FC = () => (
  <AbsoluteFill style={{background: S.bg1}}>
    <Fonts />
    <AbsoluteFill style={{background: S.bg2, opacity: 0.45}} />
    <Stage3D orbitX={5} orbitY={12} speed={0} push={80} durF={1}>
      <Layer z={-650} x={-250} y={-520} rotZ={16} focusZ={0} dof={0.012}><C><Slab3D w={620} h={620} depth={30} radius={150} front="rgba(255,255,255,0.18)" side="#3B1C99" /></C></Layer>
      <Layer z={-380} x={300} y={250} rotZ={-12} focusZ={0} dof={0.012}><C><Slab3D w={560} h={560} depth={30} radius={140} front="rgba(100,228,255,0.4)" side="#1789A6" /></C></Layer>
      <Shadow z={-200} x={-330} y={560} w={200} />
      <Layer z={-200} x={-330} y={330}><C><Sphere3D size={230} base="#FF5C8A" /></C></Layer>
      <Layer z={60} y={-300}><C>
        <Text3D text="3D" size={640} face="#FFD34D" side="#C9701A" depth={64} angle={66} style={{position: 'absolute', left: -450, width: 900, top: -420}} />
      </C></Layer>
      <Layer z={140} y={330}><C>
        <Slab3D w={760} h={230} depth={46} radius={60} front="linear-gradient(160deg,#FFFFFF,#E9E2FF)" side="#FF5C8A" rotX={8} rotY={-12} rotZ={-2}>
          <div style={{fontFamily: ARABIC_FONT, fontWeight: 900, fontSize: 104, color: '#3B1C99', direction: 'rtl'}}>ستايل ثري دي</div>
        </Slab3D>
      </C></Layer>
      <Shadow z={380} x={340} y={700} w={180} />
      <Layer z={380} x={340} y={-560}><C><Cube3D size={210} color="#64E4FF" rx={28} ry={38} rz={6} /></C></Layer>
      <Layer z={520} x={-340} y={620} focusZ={0} dof={0.014}><C><Ring3D size={280} thick={42} color="#FFFFFF" rx={62} ry={24} /></C></Layer>
    </Stage3D>
    <Grain opacity={S.grain} />
    <Vignette strength={S.vignette} />
  </AbsoluteFill>
);
