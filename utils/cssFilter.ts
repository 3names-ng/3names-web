// utils/cssFilter.ts
//
// The browser's own image filters, for the web versions of the camera filter
// components (Skia's shader needs a ~7 MB engine download on web). Close to,
// not identical to, the native shader in components/camera/filterShader.ts.

import type { FilterParams } from "@/constants/cameraFilters";

/** CSS `filter` value for brightness, contrast, saturation, gamma and sepia. */
export function cssFilterOf(p: FilterParams): string {
  const parts: string[] = [];
  // Native adds brightness to every channel; gamma lifts/darkens mid-tones —
  // both approximated by CSS brightness
  const brightness = (1 + p.brightness) * (1 + (p.gamma - 1) * 0.5);
  if (Math.abs(brightness - 1) > 0.001) parts.push(`brightness(${brightness.toFixed(3)})`);
  if (p.contrast !== 1) parts.push(`contrast(${p.contrast})`);
  if (p.saturation !== 1) parts.push(`saturate(${p.saturation})`);
  if (p.sepia > 0) parts.push(`sepia(${p.sepia})`);
  return parts.length ? parts.join(" ") : "none";
}

/** Colour wash for the per-channel tint (gain), or null when there's none. */
export function tintColorOf(p: FilterParams): string | null {
  const [r, g, b] = p.gain;
  const strength = Math.max(Math.abs(r - 1), Math.abs(g - 1), Math.abs(b - 1));
  if (strength === 0) return null;
  const channel = (gain: number) => Math.round(Math.min(255, Math.max(0, 128 + (gain - 1) * 900)));
  return `rgba(${channel(r)}, ${channel(g)}, ${channel(b)}, ${Math.min(0.3, strength * 1.6).toFixed(3)})`;
}

/** Lifted blacks (fade) as a white wash, or null. */
export function fadeColorOf(p: FilterParams): string | null {
  return p.fade > 0 ? `rgba(255, 255, 255, ${(p.fade * 0.6).toFixed(3)})` : null;
}
