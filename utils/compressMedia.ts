// utils/compressMedia.ts
//
// Shrinks a photo/video just before it uploads (posts and stories), so users
// on mobile data upload ~25 MB a minute of video instead of 100+ MB.
// Targets live in constants/mediaQuality.ts (720p, ~3.5 Mbps).
//
// Uses react-native-compressor, a native module — not in Expo Go, where the
// cameras/picker already record smaller and the original is uploaded as is.
// Never throws: if anything goes wrong the original uri is returned, so a
// post is never lost to a failed compression.

import { File } from "expo-file-system";

import {
  IMAGE_MAX_SIDE,
  IMAGE_QUALITY,
  IMAGE_SKIP_BELOW_BYTES,
  VIDEO_BITRATE,
  VIDEO_MAX_SIDE,
  VIDEO_SKIP_BELOW_BYTES,
} from "@/constants/mediaQuality";
import { IS_EXPO_GO, IS_WEB } from "./runtime";

type Compressor = typeof import("react-native-compressor");

let compressor: Compressor | null = null;
// Native only — not in Expo Go or the browser (web uploads the original)
if (!IS_EXPO_GO && !IS_WEB) {
  try {
    compressor = require("react-native-compressor");
  } catch {
    // Not in this build (e.g. an older dev build) — upload originals
  }
}

function fileSize(uri: string): number | null {
  try {
    return new File(uri).size ?? null;
  } catch {
    return null;
  }
}

const withScheme = (path: string) => (path.startsWith("file://") || path.includes("://") ? path : `file://${path}`);

/**
 * Returns a smaller copy of the photo/video to upload, or the original uri
 * when it's already small, compression isn't available, or it fails.
 */
export async function compressForUpload(uri: string, type: "photo" | "video"): Promise<string> {
  if (!compressor) return uri;

  const size = fileSize(uri);
  const skipBelow = type === "video" ? VIDEO_SKIP_BELOW_BYTES : IMAGE_SKIP_BELOW_BYTES;
  if (size !== null && size < skipBelow) return uri;

  try {
    const out =
      type === "video"
        ? await compressor.Video.compress(uri, {
            compressionMethod: "manual",
            maxSize: VIDEO_MAX_SIDE,
            bitrate: VIDEO_BITRATE,
          })
        : await compressor.Image.compress(uri, {
            compressionMethod: "manual",
            maxWidth: IMAGE_MAX_SIDE,
            maxHeight: IMAGE_MAX_SIDE,
            quality: IMAGE_QUALITY,
            output: "jpg",
          });
    const result = withScheme(out);

    // Keep the original if compressing somehow made it bigger
    const newSize = fileSize(result);
    if (size !== null && newSize !== null && newSize >= size) return uri;
    return result;
  } catch (e) {
    console.warn("Compression failed — uploading the original:", e);
    return uri;
  }
}
