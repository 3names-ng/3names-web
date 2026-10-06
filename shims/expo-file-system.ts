type FileRepresentation = {
  uri: string;
  size?: number;
  name?: string;
  blob?: Blob;
  [key: string]: any;
};

/**
 * Minimal web stand-in for expo-file-system's new File/Directory/Paths API.
 * Paths are pseudo-URLs; File keeps a Blob behind `uri` (blob: or object:).
 * Destructive directory operations are safe no-ops — there is no shared
 * cache folder in a browser, matching the app's "unimplemented on web"
 * assumptions.
 */
export class File {
  uri: string;
  readonly name: string;
  size: number;
  isDirectory = false;
  private _blob?: Blob;

  constructor(...parts: any[]) {
    const last = parts[parts.length - 1];
    this.name = typeof last === "string" ? last.split("/").pop() || "file" : "file";
    const first = parts[0];
    if (first instanceof File) {
      this.uri = first.uri;
      this._blob = first._blob;
      this.size = first.size;
    } else if (typeof first === "string") {
      this.uri = first;
      this.size = 0;
    } else {
      this.uri = "";
      this.size = 0;
    }
    if (parts.length > 1 && typeof parts[parts.length - 1] === "string") {
      this.uri = [parts[0], parts[parts.length - 1]].join("/").replace(/\/+/g, "/");
    }
  }

  static from(blob: Blob, name = "file"): File {
    const f = new File(URL.createObjectURL(blob), name);
    f._blob = blob;
    f.size = blob.size;
    return f;
  }

  /** Only real browser resources exist; virtual paths (Paths.cache/...) never do. */
  get exists(): boolean {
    return !!this._blob || /^(blob:|data:|https?:)/.test(this.uri);
  }

  /** No writable file system on web; callers fall back to the source uri. */
  copy(_destination: File | Directory): void {
    throw new Error("expo-file-system: copy() is not supported on web");
  }

  move(_destination: File | Directory): void {
    throw new Error("expo-file-system: move() is not supported on web");
  }

  blob(): Promise<Blob> {
    if (this._blob) return Promise.resolve(this._blob);
    return fetch(this.uri).then((r) => r.blob());
  }

  async text(): Promise<string> {
    const b = await this.blob();
    return b.text();
  }

  async base64(): Promise<string> {
    const b = await this.blob();
    const buf = await b.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async write(content: any): Promise<void> {
    if (content instanceof Blob) {
      this._blob = content;
      this.size = content.size;
      this.uri = URL.createObjectURL(content);
    } else {
      const blob = new Blob([String(content)]);
      this._blob = blob;
      this.size = blob.size;
      this.uri = URL.createObjectURL(blob);
    }
  }

  delete(): void {
    this._blob = undefined;
  }

  create(_options?: any): void {}

  static async downloadFileAsync(url: string, _destination?: any, options?: any): Promise<File> {
    const res = await fetch(url, options?.headers ? { headers: options.headers } : undefined);
    const blob = await res.blob();
    const name = url.split("/").pop()?.split("?")[0] || "download";
    return File.from(blob, name);
  }

  info(): Promise<{ exists: boolean; size: number; uri: string; modificationTime: number }> {
    return Promise.resolve({
      exists: this.exists,
      size: this.size,
      uri: this.uri,
      modificationTime: Date.now() / 1000,
    });
  }
}

export class Directory {
  readonly uri: string;
  readonly name: string;
  isDirectory = true;

  constructor(...parts: any[]) {
    const first = parts[0];
    if (first instanceof Directory || first instanceof File) {
      this.uri = first.uri;
    } else {
      this.uri = typeof first === "string" ? first : "";
    }
    const last = parts[parts.length - 1];
    this.name = typeof last === "string" ? last : this.uri.split("/").pop() || "dir";
  }

  get exists(): boolean {
    return false;
  }

  create(_options?: any): void {}
  delete(_options?: any): void {}
  list(): (File | Directory)[] {
    return [];
  }
  async existsAsync(): Promise<boolean> {
    return false;
  }
}

export const Paths = {
  cache: "cache://cache",
  document: "document://document",
  library: "library://library",
  temporary: "tmp://tmp",
  application: "app://app",
  home: "home://home",
};

export const FileSystem = {
  File,
  Directory,
  Paths,
  cacheDirectory: Paths.cache,
  documentDirectory: Paths.document,
  bundleDirectory: "bundle://bundle",
  EncodingType: { UTF8: "utf8", Base64: "base64" } as any,
  documentDirectoryExists: async () => false,
  cacheDirectoryExists: async () => false,
  deleteAsync: async (_path: string, _opts?: any) => {},
  makeDirectoryAsync: async (_path: string, _opts?: any) => {},
  readDirectoryAsync: async (_path: string) => [] as string[],
  readAsStringAsync: async (_path: string) => "",
  writeAsStringAsync: async (_path: string, _data: string, _opts?: any) => {},
  getInfoAsync: async (_path: string) => ({ exists: false, isDirectory: false }),
  downloadFileAsync: async (url: string, _opts?: any) => File.downloadFileAsync(url),
  copyAsync: async (_args: any) => {},
  moveAsync: async (_args: any) => {},
  readZipEntry: async (_path: string, _entry: string) => "",
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: async () => ({ granted: false, directoryUri: "" }),
    readDirectoryAsync: async () => [] as string[],
    readAsStringAsync: async () => "",
    writeAsStringAsync: async () => {},
  },
};

export type FilesystemDirectory = Directory;
export type { FileRepresentation };
export default FileSystem;
