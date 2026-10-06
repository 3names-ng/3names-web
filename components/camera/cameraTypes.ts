import type { StyleProp, ViewStyle } from 'react-native';

import type { FilterParams } from '@/constants/cameraFilters';

/**
 * Shared camera contract implemented by both backends:
 * - filterCamera.tsx  — VisionCamera + Skia, live filters (development/production builds)
 * - expoGoCamera.tsx  — expo-camera, no live filters (Expo Go, which can't load VisionCamera)
 *
 * Keep this file free of VisionCamera imports so Expo Go never loads it.
 */

export type RecordingFinishedReason = 'stopped' | 'max-duration-reached' | 'max-file-size-reached';

export interface RecordOptions {
  /** Seconds; recording stops by itself when reached */
  maxDuration?: number;
  onFinished: (uri: string, reason: RecordingFinishedReason) => void;
  onError: (error: Error) => void;
}

export interface FilterCameraHandle {
  /** Captures a photo — with the filter baked in when filters are live. Returns a file:// uri. */
  takePhoto: () => Promise<string>;
  startRecording: (options: RecordOptions) => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
}

export interface FilterCameraProps {
  style?: StyleProp<ViewStyle>;
  facing: 'back' | 'front';
  isActive: boolean;
  /** Photo or video mode (the expo-camera backend needs to know up front) */
  mode?: 'photo' | 'video';
  /** Filter shown live (and baked into photos) — ignored where live filters aren't supported */
  filter: FilterParams;
  /** Flash: torch on while recording / briefly for photos */
  flash: boolean;
  /** Zoom factor, 1 = no zoom (see zoomFactorFromSelector) */
  zoom: number;
  /** Record microphone audio (off when a sound is chosen) */
  enableAudio: boolean;
  /** Called once if live filters can't run here; the plain camera is used instead */
  onFiltersUnavailable?: () => void;
  onError?: (error: Error) => void;
}

/**
 * ZoomSelector's 0.5x / 1x / 2x buttons (expo-camera style 0…1 values) →
 * zoom factors. VisionCamera clamps to the device's range, so 0.5x only takes
 * effect on phones with an ultra-wide lens.
 */
export function zoomFactorFromSelector(value: number) {
  if (value <= 0.01) return 0.5;
  if (value < 0.25) return 1;
  return 2;
}
