export type ThumbnailResult = { uri: string; width: number; height: number };

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = src;
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error("video load failed: " + src));
  });
}

/**
 * Grabs a poster frame for a video by drawing it to a canvas and returning a
 * PNG data URL (works for same-origin and CORS-enabled media).
 */
export async function getThumbnailAsync(
  uri: string,
  options?: { time?: number; quality?: number; width?: number; height?: number }
): Promise<ThumbnailResult> {
  const empty = { uri: "", width: 0, height: 0 };
  try {
    if (!uri || typeof document === "undefined") return empty;
    const video = await loadVideo(uri);
    const time = options?.time && options.time > 0 ? options.time / 1000 : 0.1;
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      video.onseeked = done;
      try {
        video.currentTime = Math.min(time, (video.duration || 1) * 0.5);
      } catch {
        resolve();
      }
      setTimeout(resolve, 1500);
    });
    const width = options?.width || video.videoWidth || 320;
    const height = options?.height || video.videoHeight || 180;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return empty;
    ctx.drawImage(video, 0, 0, width, height);
    const uriOut = canvas.toDataURL("image/png", options?.quality ?? 0.8);
    video.src = "";
    return { uri: uriOut, width, height };
  } catch {
    return empty;
  }
}

export const VideoThumbnails = { getThumbnailAsync };
export default VideoThumbnails;
