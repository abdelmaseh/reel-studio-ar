// Trimmed from reel-studio `engine/src/core/safe.tsx` (Apache-2.0, https://github.com/mohamedabdou-ai/reel-studio).
// Only what the ported core modules need: the 1080x1920 frame constant and the probe context.
// The original also ships Instagram safe-zone profiles; our caption layout handles safe areas in the runbook instead.
import React, { createContext, useContext } from "react";

export const FRAME = { width: 1080, height: 1920, aspect: "9:16" } as const;

const ProbeCtx = createContext<string | null>(null);
export const ProbeProvider = ProbeCtx.Provider;

/** Non-null while a still/probe render is checking surfaces: ported components render a simplified pass. */
export const useProbe = (): string | null => useContext(ProbeCtx);
