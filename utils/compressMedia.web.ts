// Web version of utils/compressMedia.ts (Metro picks this file for the browser).
// react-native-compressor is native-only, so on web the original is uploaded.

export async function compressForUpload(uri: string, _type: "photo" | "video"): Promise<string> {
  return uri;
}
