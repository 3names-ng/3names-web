// expo-media-library has no browser implementation. Its only caller
// (MediaLightboxModal) returns early on web; these stubs satisfy the import.
export type PermissionResponse = { status: "granted" | "denied" | "undetermined"; granted: boolean };

export async function requestPermissionsAsync(_writeOnly?: boolean): Promise<PermissionResponse> {
  return { status: "denied", granted: false };
}

export async function saveToLibraryAsync(_uri: string): Promise<void> {
  throw new Error("Saving to the media library is not available on web");
}
