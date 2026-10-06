export type ImagePickerAsset = {
  uri: string;
  width: number;
  height: number;
  type?: "image" | "video";
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number;
  base64?: string;
  exif?: Record<string, any>;
  assetId?: string;
  [key: string]: any;
};

export type ImagePickerResult = {
  canceled: boolean;
  assets: ImagePickerAsset[];
};

export type ImagePickerPermissionResult = {
  status: "granted" | "denied" | "undetermined";
  granted: boolean;
  canAskAgain: boolean;
  expires: "never" | "never";
  ios?: { status?: string };
  android?: { status?: string };
};

export type MediaTypeOptions = {
  Images: "image";
  Videos: "video";
  All: "all";
};

export type MediaType = "image" | "video" | "livePhoto";

function pickFiles(accept: string, multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve([]);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.style.display = "none";
    document.body.appendChild(input);
    let settled = false;
    const finish = (files: File[]) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(files);
    };
    input.onchange = () => finish(Array.from(input.files || []));
    // If the dialog is dismissed, browsers fire no event; clean up lazily.
    window.addEventListener(
      "focus",
      () => setTimeout(() => finish(Array.from(input.files || [])), 500),
      { once: true }
    );
    input.click();
  });
}

function fileToAsset(file: File): ImagePickerAsset {
  const isVideo = file.type.startsWith("video/");
  return {
    uri: URL.createObjectURL(file),
    width: 0,
    height: 0,
    type: isVideo ? "video" : "image",
    mimeType: file.type || undefined,
    fileName: file.name,
    fileSize: file.size,
  };
}

export const ImagePicker = {
  MediaTypeOptions: {
    Images: "image",
    Videos: "video",
    All: "all",
  } as any as MediaTypeOptions,
  MediaType: { Images: "image", Videos: "video", All: "all", LivePhotos: "livePhoto" } as any,
  VideoExportPreset: { H264: 0, HEVC: 1, Highest: 2, Low: 3, Medium: 4, HighestQuality: 5 } as any,
  quality: 1,

  async requestCameraPermissionsAsync(): Promise<ImagePickerPermissionResult> {
    return {
      status: "granted",
      granted: true,
      canAskAgain: true,
      expires: "never",
      ios: { status: "authorized" },
      android: { status: "granted" },
    };
  },

  async requestMediaLibraryPermissionsAsync(): Promise<ImagePickerPermissionResult> {
    return ImagePicker.requestCameraPermissionsAsync();
  },

  async getMediaLibraryPermissionsAsync(): Promise<ImagePickerPermissionResult> {
    return ImagePicker.requestCameraPermissionsAsync();
  },

  async getCameraPermissionsAsync(): Promise<ImagePickerPermissionResult> {
    return ImagePicker.requestCameraPermissionsAsync();
  },

  async launchCameraAsync(_options?: any): Promise<ImagePickerResult> {
    return ImagePicker.launchImageLibraryAsync({ ..._options, mediaTypes: "images" });
  },

  async launchImageLibraryAsync(options?: any): Promise<ImagePickerResult> {
    const mediaTypes = options?.mediaTypes ?? options?.mediaTypes ?? "all";
    const acceptsImage =
      mediaTypes === ("image" as any) ||
      mediaTypes === (ImagePicker.MediaTypeOptions as any).Images ||
      mediaTypes === "Images" ||
      (Array.isArray(mediaTypes) && mediaTypes.includes("image")) ||
      mediaTypes === "all";
    const acceptsVideo =
      mediaTypes === ("video" as any) ||
      mediaTypes === (ImagePicker.MediaTypeOptions as any).Videos ||
      mediaTypes === "Videos" ||
      (Array.isArray(mediaTypes) && mediaTypes.includes("video")) ||
      mediaTypes === "all";

    let accept = "";
    if (acceptsImage && acceptsVideo) accept = "image/*,video/*";
    else if (acceptsVideo) accept = "video/*";
    else accept = "image/*";

    const files = await pickFiles(accept, !!options?.allowsMultipleSelection);
    if (!files.length) return { canceled: true, assets: [] };
    const max = options?.selectionLimit && options.selectionLimit > 0 ? options.selectionLimit : files.length;
    return {
      canceled: false,
      assets: files.slice(0, max).map(fileToAsset),
    };
  },

  async dismissCameraAsync(): Promise<void> {},
  getPendingPhotoAsync: async () => null,
  attachMediaListener: () => ({ remove() {} }),
  removeMediaListener: () => {},
};

export type ImagePickerOptions = any;
export type CameraCapturedPicture = ImagePickerAsset;
export type ImagePickerCanceledResult = { canceled: true; assets: [] };

export default ImagePicker;

// Namespace-style access (`import * as ImagePicker from "expo-image-picker"`).
export const {
  MediaTypeOptions,
  VideoExportPreset,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  getCameraPermissionsAsync,
  launchCameraAsync,
  launchImageLibraryAsync,
  dismissCameraAsync,
  getPendingPhotoAsync,
} = ImagePicker;
