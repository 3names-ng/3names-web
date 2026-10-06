import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

import { IS_EXPO_GO } from '@/utils/runtime';
import type { FilterCameraHandle, FilterCameraProps } from './cameraTypes';

/**
 * Picks the camera implementation once, at startup:
 * - Expo Go → expo-camera, no live filters (filters are chosen after capture)
 * - development / production builds → VisionCamera + Skia live filters
 *
 * VisionCamera is only `require`d outside Expo Go — even importing it there
 * would crash, because its native (Nitro) modules aren't in the Expo Go app.
 */

/** Live (while-filming) filters are available in this build. */
export const LIVE_FILTERS = !IS_EXPO_GO;

type CameraComponent = ForwardRefExoticComponent<FilterCameraProps & RefAttributes<FilterCameraHandle>>;

export const CameraBackend: CameraComponent = IS_EXPO_GO
  ? require('./expoGoCamera').default
  : require('./filterCamera').default;

export interface CameraAccess {
  hasPermission: boolean;
  /** False once the user has denied it for good (must use the phone's Settings) */
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

function useExpoCameraAccess(): CameraAccess {
  const [permission, request] = useCameraPermissions();
  return {
    hasPermission: !!permission?.granted,
    canRequestPermission: !permission || (!permission.granted && permission.canAskAgain),
    requestPermission: async () => (await request()).granted,
  };
}

function useExpoMicrophoneAccess(): CameraAccess {
  const [permission, request] = useMicrophonePermissions();
  return {
    hasPermission: !!permission?.granted,
    canRequestPermission: !permission || (!permission.granted && permission.canAskAgain),
    requestPermission: async () => (await request()).granted,
  };
}

// The runtime never changes, so each name is always the same hook — safe for the rules of hooks
export const useCameraAccess: () => CameraAccess = IS_EXPO_GO
  ? useExpoCameraAccess
  : require('react-native-vision-camera').useCameraPermission;

export const useMicrophoneAccess: () => CameraAccess = IS_EXPO_GO
  ? useExpoMicrophoneAccess
  : require('react-native-vision-camera').useMicrophonePermission;
