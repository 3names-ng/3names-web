import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Platform } from 'react-native';
import { CameraView } from 'expo-camera';

import { IMAGE_QUALITY, VIDEO_BITRATE } from '@/constants/mediaQuality';
import type { FilterCameraHandle, FilterCameraProps } from './cameraTypes';

/** Zoom factor (1 = none) → expo-camera's 0…1 zoom, matching ZoomSelector's buttons. */
function expoZoom(factor: number) {
  if (factor <= 0.5) return 0;
  if (factor <= 1) return 0.15;
  return 0.35;
}

/**
 * Camera for Expo Go, which can't load VisionCamera. Same contract as
 * FilterCamera, but without live filters: the screen offers filters after
 * capture instead (photos baked on the phone, videos by the server).
 */
const ExpoGoCamera = forwardRef<FilterCameraHandle, FilterCameraProps>(function ExpoGoCamera(
  { style, facing, isActive, mode = 'photo', flash, zoom, enableAudio, onFiltersUnavailable },
  ref,
) {
  const cameraRef = useRef<CameraView>(null);
  const recordingRef = useRef(false);

  // No live filters in Expo Go — tell the screen once so it hides the live strip
  useEffect(() => {
    onFiltersUnavailable?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      takePhoto: async () => {
        const photo = await cameraRef.current?.takePictureAsync({ quality: IMAGE_QUALITY });
        if (!photo?.uri) throw new Error('The camera is not ready yet');
        return photo.uri;
      },
      startRecording: async ({ maxDuration, onFinished, onError }) => {
        const camera = cameraRef.current;
        if (!camera || recordingRef.current) return;
        recordingRef.current = true;
        // recordAsync resolves when recording stops (stopRecording or maxDuration)
        camera
          // iOS only applies videoBitrate when the codec is given
          .recordAsync({ ...(maxDuration ? { maxDuration } : {}), ...(Platform.OS === 'ios' ? { codec: 'avc1' as const } : {}) })
          .then((video) => {
            recordingRef.current = false;
            if (video?.uri) onFinished(video.uri, 'stopped');
            else onError(new Error('No video was recorded'));
          })
          .catch((error: Error) => {
            recordingRef.current = false;
            onError(error);
          });
      },
      // Pausing needs toggleRecordingAsync (newer iOS/Android); otherwise it's a no-op
      pauseRecording: async () => {
        await cameraRef.current?.toggleRecordingAsync?.();
      },
      resumeRecording: async () => {
        await cameraRef.current?.toggleRecordingAsync?.();
      },
      stopRecording: async () => {
        cameraRef.current?.stopRecording();
      },
      cancelRecording: async () => {
        cameraRef.current?.stopRecording();
        recordingRef.current = false;
      },
    }),
    [],
  );

  return (
    <CameraView
      ref={cameraRef}
      style={style}
      active={isActive}
      facing={facing}
      mode={mode === 'video' ? 'video' : 'picture'}
      flash={flash ? 'on' : 'off'}
      enableTorch={flash && mode === 'video'}
      zoom={expoZoom(zoom)}
      // With a sound, record without the mic
      mute={!enableAudio}
      // Record at upload size (720p, ~3.5 Mbps) rather than the phone's maximum
      videoQuality="720p"
      videoBitrate={VIDEO_BITRATE}
    />
  );
});

export default ExpoGoCamera;
