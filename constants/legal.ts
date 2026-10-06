import { openBrowserAsync } from "expo-web-browser";

// Both stores require these to be reachable from inside the app.
export const LEGAL_URLS = {
  terms: "https://www.3names.ng/terms",
  privacy: "https://www.3names.ng/privacy",
} as const;

export function openLegalPage(page: keyof typeof LEGAL_URLS) {
  return openBrowserAsync(LEGAL_URLS[page]);
}
