// utils/uploadFile.ts
//
// Attaches a picked/recorded file to a multipart upload on any platform.
// On phones, React Native's FormData takes { uri, name, type } and reads the
// file itself. Browsers don't: they need the file's data as a Blob, so on web
// the uri (blob:, data: or http) is fetched first.

import { IS_WEB } from "./runtime";

export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export async function appendUploadFile(form: FormData, field: string, file: UploadFile): Promise<void> {
  if (IS_WEB) {
    const blob = await (await fetch(file.uri)).blob();
    // Keep the declared type if the blob has none (some data: uris)
    const typed = blob.type ? blob : new Blob([blob], { type: file.type });
    form.append(field, typed, file.name);
    return;
  }
  form.append(field, file as unknown as Blob);
}
