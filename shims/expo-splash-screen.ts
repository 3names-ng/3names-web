/** No-op web shim: there is no native splash screen in a browser. */
export async function preventAutoHideAsync(): Promise<void> {}
export async function hideAsync(): Promise<void> {}
export function setOptions(_options: any): void {}

export default {
  preventAutoHideAsync,
  hideAsync,
  setOptions,
};
