export type DocumentPickerAsset = {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
  lastModified?: number;
  [key: string]: any;
};

export type DocumentPickerResult = {
  canceled: boolean;
  assets: DocumentPickerAsset[];
};

export type DocumentPickerOptions = {
  type?: string | string[];
  multiple?: boolean;
  copyToCacheDirectory?: boolean;
  excludeConflictingTypes?: boolean;
  asCopy?: boolean;
};

function pickFiles(accept: string, multiple: boolean): Promise<File[]> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve([]);
    const input = document.createElement("input");
    input.type = "file";
    if (accept) input.accept = accept;
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
    window.addEventListener(
      "focus",
      () => setTimeout(() => finish(Array.from(input.files || [])), 500),
      { once: true }
    );
    input.click();
  });
}

function normalizeAccept(type?: string | string[]): string {
  if (!type) return "";
  const list = Array.isArray(type) ? type : [type];
  return list
    .map((t) => {
      if (t.includes("*")) {
        const [scope, sub] = t.split("/");
        return sub === "*" ? `${scope}/*` : t;
      }
      // Map common mime/type strings onto extensions where browsers expect them.
      if (t.startsWith(".")) return t;
      return t;
    })
    .filter(Boolean)
    .join(",");
}

export const DocumentPicker = {
  async getDocumentAsync(options?: DocumentPickerOptions): Promise<DocumentPickerResult> {
    const files = await pickFiles(normalizeAccept(options?.type), !!options?.multiple);
    if (!files.length) return { canceled: true, assets: [] };
    return {
      canceled: false,
      assets: files.map((file) => ({
        uri: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        mimeType: file.type || undefined,
        lastModified: file.lastModified,
      })),
    };
  },

  async releaseCacheAsync(_uri: string): Promise<void> {},
  getDocumentAsyncTypes: undefined,
  types: {
    allFiles: "*/*",
    audio: "audio/*",
    images: "image/*",
    plainText: "text/plain",
    pdf: "application/pdf",
    video: "video/*",
    xml: "application/xml,text/xml",
    zip: "application/zip,application/x-zip-compressed",
  },
};

export type DocumentPickerCancelledResult = { canceled: true; assets: [] };

export default DocumentPicker;

// Namespace-style access (`import * as DocumentPicker from "expo-document-picker"`).
export const { getDocumentAsync, releaseCacheAsync } = DocumentPicker;
