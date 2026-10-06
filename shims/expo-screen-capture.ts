/** Type-only usage in the codebase; provide the shape for tsc. */
export type ScreenCaptureType = {
  preventScreenCaptureAsync?: () => Promise<void>;
  allowScreenCaptureAsync?: () => Promise<void>;
  [key: string]: any;
};

// Browsers can't block screenshots; these are no-ops (as in expo-screen-capture's web build).
export async function preventScreenCaptureAsync(_key?: string): Promise<void> {}
export async function allowScreenCaptureAsync(_key?: string): Promise<void> {}
export function usePreventScreenCapture(_enabled?: boolean): void {}
export function useScreenCapture(): { isActive: boolean; preventScreenCaptureAsync: () => Promise<void>; allowScreenCaptureAsync: () => Promise<void> } {
  return {
    isActive: false,
    preventScreenCaptureAsync: async () => {},
    allowScreenCaptureAsync: async () => {},
  };
}

export const ScreenCapture = {
  preventScreenCaptureAsync,
  allowScreenCaptureAsync,
  usePreventScreenCapture,
  useScreenCapture,
};

export default ScreenCapture;
