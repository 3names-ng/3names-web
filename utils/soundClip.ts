// utils/soundClip.ts
//
// Makes post/story sounds start instantly:
// - Cloudinary cuts out just the clip that plays (from startMs, SOUND_CLIP_MS
//   long) at 96 kbps — ~0.4 MB instead of the whole 3–6 MB song, and it starts
//   at 0:00 so the player doesn't have to buffer up to the start point.
// - Feed cards prefetch their clip to the phone's cache while they're nearby,
//   so it plays from disk the moment the post is on screen.

import { Directory, File, Paths } from "expo-file-system";

import { SOUND_CLIP_MS, type SoundSelection } from "@/service/sound.service";
import { IS_WEB } from "./runtime";

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.+)$/;

export interface ClipSource {
  /** Where to stream it from */
  url: string;
  /** Where in `url` playback starts, seconds (0 for a cut clip) */
  startSec: number;
  /** Where the clip ends in `url`, seconds — loops back to startSec there */
  endSec: number;
  /** Cache file name, when the clip can be cached */
  cacheName: string | null;
}

/** The clip to play for a selection (or the full track when it can't be cut, or fullTrack is asked for). */
export function clipSource(selection: SoundSelection, fullTrack = false): ClipSource {
  const { sound, startMs } = selection;
  const clipEndMs = Math.min(startMs + SOUND_CLIP_MS, sound.durationMs || Number.MAX_SAFE_INTEGER);
  const match = !fullTrack ? CLOUDINARY_UPLOAD.exec(sound.audioUrl) : null;
  if (!match) {
    return { url: sound.audioUrl, startSec: startMs / 1000, endSec: clipEndMs / 1000, cacheName: null };
  }
  const startSec = Math.max(0, Math.round(startMs / 100) / 10);
  const lengthSec = Math.max(1, (clipEndMs - startMs) / 1000);
  return {
    url: `${match[1]}so_${startSec},du_${Math.ceil(lengthSec)},br_96k/${match[2]}`,
    startSec: 0,
    endSec: lengthSec,
    cacheName: `${sound.id}_${Math.round(startSec * 10)}.mp3`,
  };
}

const ready = new Map<string, string>();
const pending = new Map<string, Promise<string | null>>();

// Created on first use, not at import: the browser has no phone file system,
// so on web nothing is cached (the browser's own HTTP cache does that job)
let clipDir: Directory | null = null;
function getDir(): Directory | null {
  if (IS_WEB) return null;
  if (!clipDir) {
    try {
      clipDir = new Directory(Paths.cache, "sound-clips");
    } catch {
      return null;
    }
  }
  return clipDir;
}

/** Local file uri of an already-downloaded clip, if any. */
export function cachedClipUri(source: ClipSource): string | null {
  const name = source.cacheName;
  const dir = getDir();
  if (!name || !dir) return null;
  const known = ready.get(name);
  if (known) return known;
  try {
    const file = new File(dir, name);
    if (file.exists) {
      ready.set(name, file.uri);
      return file.uri;
    }
  } catch {
    // cache unavailable — stream instead
  }
  return null;
}

/** Downloads the clip to the cache in the background (once). Never throws. */
export function prefetchClip(source: ClipSource): Promise<string | null> {
  const name = source.cacheName;
  const dir = getDir();
  if (!name || !dir) return Promise.resolve(null);
  const cached = cachedClipUri(source);
  if (cached) return Promise.resolve(cached);
  const inFlight = pending.get(name);
  if (inFlight) return inFlight;

  const job = (async () => {
    try {
      if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
      // Download under a temp name so a half-written file is never played
      const tmp = new File(dir, `${name}.part`);
      if (tmp.exists) tmp.delete();
      await File.downloadFileAsync(source.url, tmp);
      tmp.move(new File(dir, name));
      const uri = new File(dir, name).uri;
      ready.set(name, uri);
      return uri;
    } catch {
      return null;
    } finally {
      pending.delete(name);
    }
  })();
  pending.set(name, job);
  return job;
}
