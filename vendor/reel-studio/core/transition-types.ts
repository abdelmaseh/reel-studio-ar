// Studio-local minimal contract replacing reel-studio's prepared-edit/transition-registry (Apache-2.0 port).
// The vendored transitions-v4 components are driven by these props only.
import type React from "react";
import type { LensState } from "../kits/liquid-glass-lens";

export type Box = { x: number; y: number; width: number; height: number };

export type TransitionProps = {
  /** Frame (composition clock) at which the transition is centered/starts. */
  atFrame: number;
  durationInFrames: number;
  fps: number;
  box?: Box;
  dir?: "rtl" | "ltr" | "up" | "down";
  shape?: "inset" | "circle" | "polygon" | "keyhole";
  origin?: { x: number; y: number };
  /** Paper color for the paper-family transitions. */
  paper?: string;
  ink?: string;
  /** Previous scene node, for transitions that carry the outgoing scene (lens-zoom, ink-slab masks). */
  outgoing?: React.ReactNode;
  outgoingLens?: LensState;
  timingManaged?: boolean;
  children?: React.ReactNode;
};
