/**
 * Camera filters (TikTok-style). Every filter is a set of parameters for ONE
 * GPU shader (components/camera/filterShader.ts), used for the live camera
 * preview, the filter thumbnails and the saved photo.
 *
 * Videos are recorded raw, so the server re-applies the filter with Cloudinary
 * on upload. Cloudinary can only do brightness / contrast / saturation / gamma
 * on video — so filters that also use gain (colour tint), sepia, fade or
 * vignette are photo-only, and the camera only offers `video: true` filters
 * while filming. Keep ids and the video-safe parameters in sync with the
 * server's src/common/media-filters.ts.
 */

export interface FilterParams {
  /** Added to every channel, -0.3…0.3 */
  brightness: number;
  /** 1 = unchanged, 0.5…1.6 */
  contrast: number;
  /** 1 = unchanged, 0 = black & white, up to 2 */
  saturation: number;
  /** 1 = unchanged, >1 brightens mid-tones, <1 darkens them */
  gamma: number;
  /** Per-channel multiplier (colour tint), [1,1,1] = none — photo only */
  gain: [number, number, number];
  /** 0…1 — photo only */
  sepia: number;
  /** Lifts blacks, 0…0.3 — photo only */
  fade: number;
  /** Darkens corners, 0…1 — photo only */
  vignette: number;
}

export interface CameraFilter {
  id: string;
  name: string;
  /** Can be reproduced on video by the server (no tint/sepia/fade/vignette) */
  video: boolean;
  params: FilterParams;
}

export const NEUTRAL: FilterParams = {
  brightness: 0,
  contrast: 1,
  saturation: 1,
  gamma: 1,
  gain: [1, 1, 1],
  sepia: 0,
  fade: 0,
  vignette: 0,
};

const f = (id: string, name: string, p: Partial<FilterParams>): CameraFilter => {
  const params = { ...NEUTRAL, ...p };
  const videoSafe =
    params.gain.every((g) => g === 1) && params.sepia === 0 && params.fade === 0 && params.vignette === 0;
  return { id, name, video: videoSafe, params };
};

export const CAMERA_FILTERS: CameraFilter[] = [
  f('original', 'Original', {}),
  // ── Work on photos and videos ──
  f('vivid', 'Vivid', { saturation: 1.35, contrast: 1.12 }),
  f('punch', 'Punch', { saturation: 1.6, contrast: 1.25, brightness: 0.02 }),
  f('bright', 'Bright', { brightness: 0.08, gamma: 1.15, saturation: 1.05 }),
  f('dramatic', 'Dramatic', { contrast: 1.4, saturation: 0.9, gamma: 0.9 }),
  f('moody', 'Moody', { brightness: -0.06, contrast: 1.2, saturation: 0.75 }),
  f('soft', 'Soft', { contrast: 0.85, saturation: 0.9, brightness: 0.04 }),
  f('pastel', 'Pastel', { saturation: 0.7, brightness: 0.08, contrast: 0.88, gamma: 1.1 }),
  f('mono', 'Mono', { saturation: 0, contrast: 1.1 }),
  f('noir', 'Noir', { saturation: 0, contrast: 1.45, brightness: -0.04 }),
  f('glow', 'Glow', { gamma: 1.25, brightness: 0.05, saturation: 1.15, contrast: 0.95 }),
  // ── Photos only (colour tones the server can't apply to video) ──
  f('lagos_sunset', 'Lagos Sunset', { gain: [1.12, 0.98, 0.82], saturation: 1.25, contrast: 1.08 }),
  f('golden_hour', 'Golden Hour', { gain: [1.1, 1.02, 0.85], brightness: 0.04, gamma: 1.08 }),
  f('warm', 'Warm', { gain: [1.08, 1.0, 0.9] }),
  f('cool', 'Cool', { gain: [0.92, 1.0, 1.1], saturation: 1.05 }),
  f('teal_orange', 'Teal & Orange', { gain: [1.1, 0.98, 1.08], saturation: 1.3, contrast: 1.15 }),
  f('rose', 'Rose', { gain: [1.08, 0.95, 1.0], brightness: 0.03, saturation: 1.1 }),
  f('sepia', 'Sepia', { sepia: 0.85 }),
  f('vintage', 'Vintage', { sepia: 0.35, fade: 0.12, contrast: 0.92, vignette: 0.45 }),
  f('matte', 'Matte', { fade: 0.15, contrast: 0.9, saturation: 0.85 }),
  f('retro', 'Retro', { gain: [1.05, 1.0, 0.85], fade: 0.1, saturation: 0.9, vignette: 0.35 }),
  f('neon', 'Neon', { gain: [1.05, 0.9, 1.15], saturation: 1.6, contrast: 1.2 }),
];

export const FILTER_BY_ID: Record<string, CameraFilter> = Object.fromEntries(CAMERA_FILTERS.map((x) => [x.id, x]));

/** Filters offered for the current capture mode. */
export function filtersFor(mode: 'photo' | 'video'): CameraFilter[] {
  return mode === 'video' ? CAMERA_FILTERS.filter((x) => x.video) : CAMERA_FILTERS;
}
