// Upload size targets for photos and videos (TikTok-like quality, far smaller
// files than the phone's defaults — many users upload on mobile data).
// Used by the cameras (record at this size to begin with) and by
// utils/compressMedia.ts (shrinks gallery picks / anything still too big).

/** Videos: 720p (longest side 1280px) */
export const VIDEO_MAX_SIDE = 1280;
/** Videos: ~3.5 Mbps — about 25 MB a minute, still sharp on a phone screen */
export const VIDEO_BITRATE = 3_500_000;
/** Videos smaller than this upload as they are (no point re-compressing) */
export const VIDEO_SKIP_BELOW_BYTES = 15 * 1024 * 1024;

/** Photos: longest side, and JPEG quality 0–1 */
export const IMAGE_MAX_SIDE = 2048;
export const IMAGE_QUALITY = 0.8;
/** Photos smaller than this upload as they are */
export const IMAGE_SKIP_BELOW_BYTES = 1.5 * 1024 * 1024;
