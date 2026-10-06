// expo-device on web: the browser is never a "physical device" for push
// purposes, which is what the app checks this for.
export const isDevice = false;
export const brand: string | null = null;
export const manufacturer: string | null = null;
export const modelName: string | null = null;
export const modelId: string | null = null;
export const deviceName: string | null = null;
export const deviceYearClass: number | null = null;
export const totalMemory: number | null = null;
export const osName: string | null = "web";
export const osVersion: string | null = null;
export const osBuildId: string | null = null;
export const supportedCpuArchitectures: string[] | null = null;

export enum DeviceType {
  UNKNOWN = 0,
  PHONE = 1,
  TABLET = 2,
  DESKTOP = 3,
  TV = 4,
}
export const deviceType: DeviceType = DeviceType.DESKTOP;

export async function getDeviceTypeAsync(): Promise<DeviceType> {
  return DeviceType.DESKTOP;
}
