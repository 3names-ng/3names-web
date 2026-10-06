export enum WebBrowserPresentationStyle {
  FULL_SCREEN = "FULL_SCREEN",
  PAGE_SHEET = "PAGE_SHEET",
  FORM_SHEET = "FORM_SHEET",
  OVER_FULL_SCREEN = "OVER_FULL_SCREEN",
  POPOVER = "POPOVER",
  AUTOMATIC = "AUTOMATIC",
  CURRENT_CONTEXT = "CURRENT_CONTEXT",
  OVER_CURRENT_CONTEXT = "OVER_CURRENT_CONTEXT",
}

export type WebBrowserResult = {
  type: "cancel" | "dismiss" | "locked";
};

/**
 * Opens URLs in a new browser tab (the closest analogue to the in-app
 * Safari/Chrome custom tab on mobile).
 */
export async function openBrowserAsync(
  url: string,
  _options?: any
): Promise<WebBrowserResult> {
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return { type: "dismiss" };
}

export async function dismissBrowser(): Promise<void> {}

export async function openAuthSessionAsync(
  url: string,
  _redirectUrl?: string,
  _options?: any
): Promise<WebBrowserResult> {
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return { type: "dismiss" };
}

export async function maybeCompleteAuthSession(): Promise<boolean> {
  return false;
}

export function warmUpAsync(_browserPackage?: string): Promise<void> {
  return Promise.resolve();
}

export function coolDownAsync(_browserPackage?: string): Promise<void> {
  return Promise.resolve();
}

export async function getCustomTabsSupportingBrowsersAsync(): Promise<any[]> {
  return [];
}

export const WebBrowser = {
  openBrowserAsync,
  dismissBrowser,
  openAuthSessionAsync,
  maybeCompleteAuthSession,
  warmUpAsync,
  coolDownAsync,
  getCustomTabsSupportingBrowsersAsync,
  WebBrowserPresentationStyle,
};

export default WebBrowser;
