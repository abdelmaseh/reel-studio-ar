// Extracted from reel-studio `engine/src/core/transitions-dir.tsx`
// (Apache-2.0, https://github.com/mohamedabdou-ai/reel-studio). WhipPan and LightScan only;
// the original file's @remotion/transitions presentations and card-morph helpers are not ported.
import React from "react";
import { AbsoluteFill } from "remotion";
import { EASE, clamp01, inWindow, px, useClock } from "./motion";
import { CameraBlur, Smear, speedDevice, speedOf, type ShutterLike } from "./mblur";
import { useProbe } from "./safe";
import { LayerBox } from "./mask";
import {
  lightBand,
  scanGradient,
  scanOpacity,
  whipFade,
  whipOffset,
  whipPeakSpeed,
  whipProgress,
  windowProgress,
  type Dir,
  type Ease,
  type MaskMode,
  type Rect,
} from "./mask-geo";

export type WhipPanProps = {
  dir: Dir;
  at: number;
  durF?: number;
  mode?: MaskMode;
  distance?: number;
  fadeF?: number;
  device?: "smear" | "camera";
  shutter?: ShutterLike;
  box?: Rect;
  children?: React.ReactNode;
};

const WhipPanBody: React.FC<{
  dir: Dir;
  at: number;
  durF: number;
  mode: MaskMode;
  distance: number;
  fadeF: number;
  children?: React.ReactNode;
}> = ({ dir, at, durF, mode, distance, fadeF, children }) => {
  const { frame } = useClock();
  const o = whipOffset(dir, distance, whipProgress(frame, at, durF, mode), mode);
  const opacity = whipFade(frame, at, durF, fadeF, mode);
  return <AbsoluteFill style={{ transform: `translate(${px(o.x)}px, ${px(o.y)}px)`, opacity }}>{children}</AbsoluteFill>;
};

/** Directional whip with built-in speed-based motion blur (Smear trail by default, CameraBlur with device="camera"). */
export const WhipPan: React.FC<WhipPanProps> = ({
  dir,
  at,
  durF = 8,
  mode = "in",
  distance = 240,
  fadeF = 2,
  device = "smear",
  shutter,
  box,
  children,
}) => {
  const probe = useProbe();
  const { frame } = useClock();
  const a = Math.round(at);
  const d = Math.max(1, Math.round(durF));
  const present = mode === "in" ? frame >= a : frame < a + d;
  if (!present) return null;
  if (probe !== null) {
    return (
      <LayerBox box={box}>
        <AbsoluteFill>{children}</AbsoluteFill>
      </LayerBox>
    );
  }

  const peak = whipPeakSpeed(distance, d, mode);
  const live = inWindow(frame, a, a + d) && speedDevice(peak) !== "off";
  const s = shutter ?? speedOf(peak);
  const body = (
    <WhipPanBody dir={dir} at={a} durF={d} mode={mode} distance={distance} fadeF={fadeF}>
      {children}
    </WhipPanBody>
  );
  return (
    <LayerBox box={box}>
      {device === "camera" ? (
        <CameraBlur shutter={s} enabled={live}>
          {body}
        </CameraBlur>
      ) : (
        <Smear shutter={s} enabled={live}>
          {body}
        </Smear>
      )}
    </LayerBox>
  );
};

export type LightScanProps = {
  bounds: Rect;
  at: number;
  durF?: number;
  dir?: Dir;
  color?: string;
  core?: string;
  thickness?: number;
  peak?: number;
  ease?: Ease;
  blend?: React.CSSProperties["mixBlendMode"];
};

/** A light band that sweeps across a box — a cheap premium sheen on cards and titles. */
export const LightScan: React.FC<LightScanProps> = ({
  bounds,
  at,
  durF = 12,
  dir = "rtl",
  color = "#FFFFFF",
  core,
  thickness = 44,
  peak = 1,
  ease = EASE.inOut,
  blend,
}) => {
  const probe = useProbe();
  const { frame } = useClock();
  const opacity = clamp01(peak) * scanOpacity(frame, at, durF);
  if (probe !== null || opacity <= 0) return null;
  const band = lightBand(dir, windowProgress(frame, at, durF, ease), bounds, thickness);
  return (
    <div
      style={{
        position: "absolute",
        left: px(bounds.x),
        top: px(bounds.y),
        width: px(bounds.width),
        height: px(bounds.height),
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: px(band.x - bounds.x),
          top: px(band.y - bounds.y),
          width: px(band.width),
          height: px(band.height),
          background: scanGradient(band.gradientDeg, color, core),
          opacity,
          mixBlendMode: blend,
        }}
      />
    </div>
  );
};
