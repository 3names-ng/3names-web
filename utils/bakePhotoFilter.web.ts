import { FILTER_BY_ID } from '@/constants/cameraFilters';
import { cssFilterOf, fadeColorOf, tintColorOf } from './cssFilter';

/**
 * Web version of bakePhotoFilter.ts: draws the photo on a canvas through the
 * browser's CSS filters (plus tint, fade and vignette) and returns a blob: url
 * of the JPEG. Returns the original uri for "original"/unknown ids, or when
 * the browser can't filter a canvas (older Safari) — the photo then uploads
 * unfiltered rather than failing.
 */
export async function bakePhotoFilter(uri: string, filterId: string | undefined): Promise<string> {
  const filter = filterId ? FILTER_BY_ID[filterId] : undefined;
  if (!filter || filter.id === 'original') return uri;
  const p = filter.params;

  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.src = uri;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx || !('filter' in ctx)) return uri;

  const { width, height } = canvas;
  ctx.filter = cssFilterOf(p);
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';

  const tint = tintColorOf(p);
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, width, height);
  }
  const fade = fadeColorOf(p);
  if (fade) {
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, width, height);
  }
  if (p.vignette > 0) {
    const r = Math.hypot(width, height) / 2;
    const g = ctx.createRadialGradient(width / 2, height / 2, r * 0.55, width / 2, height / 2, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${(p.vignette * 0.7).toFixed(2)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  return blob ? URL.createObjectURL(blob) : uri;
}
