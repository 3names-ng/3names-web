import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

import ExpoGoCamera from './expoGoCamera';
import type { FilterCameraHandle, FilterCameraProps } from './cameraTypes';

/**
 * Web version of cameraBackend.ts (Metro picks this file for the browser).
 * Browsers can't run VisionCamera, so web always uses expo-camera — and this
 * file never references VisionCamera, so it isn't bundled for web at all.
 * Filters work as in Expo Go: picked before capture with an approximate live
 * tint, and applied to the photo/video afterwards.
 */

export const LIVE_FILTERS = false;

type CameraComponent = ForwardRefExoticComponent<FilterCameraProps & RefAttributes<FilterCameraHandle>>;

export const CameraBackend: CameraComponent = ExpoGoCamera;

export interface CameraAccess {
  hasPermission: boolean;
  /** False once the user has denied it for good (must change it in the browser's site settings) */
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useCameraAccess(): CameraAccess {
  const [permission, request] = useCameraPermissions();
  return {
    hasPermission: !!permission?.granted,
    canRequestPermission: !permission || (!permission.granted && permission.canAskAgain),
    requestPermission: async () => (await request()).granted,
  };
}

export function useMicrophoneAccess(): CameraAccess {
  const [permission, request] = useMicrophonePermissions();
  return {
    hasPermission: !!permission?.granted,
    canRequestPermission: !permission || (!permission.granted && permission.canAskAgain),
    requestPermission: async () => (await request()).granted,
  };
}
