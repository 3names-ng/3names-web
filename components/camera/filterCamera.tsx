import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { FilterMode, ImageFormat, MipmapMode, Skia, TileMode } from '@shopify/react-native-skia';
import { Camera, CommonResolutions, usePhotoOutput, useVideoOutput, type Recorder } from 'react-native-vision-camera';
import { SkiaCamera, type SkiaCameraRef } from 'react-native-vision-camera-skia';
import { File, Paths } from 'expo-file-system';

import { VIDEO_BITRATE } from '@/constants/mediaQuality';
import { filterEffect, filterUniforms } from './filterShader';
import type { FilterCameraHandle, FilterCameraProps } from './cameraTypes';

/** If no filtered frame is drawn within this time, assume Skia can't run here. */
const FIRST_FRAME_TIMEOUT_MS = 4000;
/** How long the torch stays on before a "flash" photo, so exposure adjusts. */
const FLASH_WARMUP_MS = 350;

type Props = FilterCameraProps;

const paint = Skia.Paint();

/**
 * Camera with live GPU filters (VisionCamera v5 + Skia). Frames are drawn
 * through the filter shader for the preview; photos are a snapshot of that
 * filtered preview. Videos record the raw camera — the server applies the
 * (video-safe) filter on upload.
 *
 * Falls back to VisionCamera's plain native preview (no filters) if the Skia
 * pipeline errors or never draws a frame — a known issue on some Android GPUs.
 */
const FilterCamera = forwardRef<FilterCameraHandle, Props>(function FilterCamera(
  { style, facing, isActive, filter, flash, zoom, enableAudio, onFiltersUnavailable, onError },
  ref,
) {
  const [useSkia, setUseSkia] = useState(true);
  const skiaRef = useRef<SkiaCameraRef>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const [photoTorch, setPhotoTorch] = useState(false);
  const recordingRef = useRef(false);
  const [recording, setRecording] = useState(false);

  // Record at upload size (720p, ~3.5 Mbps) rather than the phone's maximum
  const videoOutput = useVideoOutput({
    enableAudio,
    fileType: 'mp4',
    targetResolution: CommonResolutions.HD_16_9,
    targetBitRate: VIDEO_BITRATE,
  });
  // Only needed by the plain (fallback) camera; Skia photos are snapshots
  const photoOutput = usePhotoOutput();

  // Filter parameters for the frame worklet (all but the size uniforms)
  const isOriginal =
    filter.brightness === 0 &&
    filter.contrast === 1 &&
    filter.saturation === 1 &&
    filter.gamma === 1 &&
    filter.gain.every((g) => g === 1) &&
    filter.sepia === 0 &&
    filter.fade === 0 &&
    filter.vignette === 0;
  const uniforms = useSharedValue<number[]>(filterUniforms(filter, 0, 0).slice(0, 10));
  const passthrough = useSharedValue(isOriginal);
  const framesDrawn = useSharedValue(0);

  useEffect(() => {
    uniforms.value = filterUniforms(filter, 0, 0).slice(0, 10);
    passthrough.value = isOriginal;
  }, [filter, isOriginal, uniforms, passthrough]);

  // Black-screen guard: no frames drawn after a few seconds → plain camera
  useEffect(() => {
    if (!useSkia || !isActive) return;
    framesDrawn.value = 0;
    const timer = setTimeout(() => {
      if (framesDrawn.value === 0) fallBack(new Error('No camera frames were rendered'));
    }, FIRST_FRAME_TIMEOUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useSkia, isActive, facing]);

  const fallBack = (error: Error) => {
    if (!useSkia) return;
    console.warn('[FilterCamera] Live filters unavailable, using the plain camera:', error.message);
    setUseSkia(false);
    onFiltersUnavailable?.();
  };

  const torchMode = (flash && recording) || photoTorch ? 'on' : 'off';

  useImperativeHandle(
    ref,
    () => ({
      takePhoto: async () => {
        if (flash) {
          setPhotoTorch(true);
          await new Promise((r) => setTimeout(r, FLASH_WARMUP_MS));
        }
        try {
          if (useSkia && skiaRef.current) {
            const snapshot = skiaRef.current.takeSnapshot();
            if (!snapshot) throw new Error('The camera is not ready yet');
            const bytes = snapshot.encodeToBytes(ImageFormat.JPEG, 92);
            const file = new File(Paths.cache, `photo_${Date.now()}.jpg`);
            file.write(bytes);
            return file.uri;
          }
          const { filePath } = await photoOutput.capturePhotoToFile({ flashMode: flash ? 'on' : 'off' }, {});
          return filePath.startsWith('file://') ? filePath : `file://${filePath}`;
        } finally {
          if (flash) setPhotoTorch(false);
        }
      },
      startRecording: async ({ maxDuration, onFinished, onError: onRecordError }) => {
        if (recordingRef.current) return;
        const recorder = await videoOutput.createRecorder({ maxDuration });
        recorderRef.current = recorder;
        recordingRef.current = true;
        setRecording(true);
        const done = () => {
          recordingRef.current = false;
          recorderRef.current = null;
          setRecording(false);
        };
        await recorder.startRecording(
          (path, reason) => {
            done();
            onFinished(path.startsWith('file://') ? path : `file://${path}`, reason);
          },
          (error) => {
            done();
            onRecordError(error);
          },
        );
      },
      pauseRecording: async () => {
        await recorderRef.current?.pauseRecording();
      },
      resumeRecording: async () => {
        await recorderRef.current?.resumeRecording();
      },
      stopRecording: async () => {
        await recorderRef.current?.stopRecording();
      },
      cancelRecording: async () => {
        await recorderRef.current?.cancelRecording();
        recordingRef.current = false;
        recorderRef.current = null;
        setRecording(false);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flash, useSkia, videoOutput, photoOutput],
  );

  const handleError = (error: Error) => {
    onError?.(error);
  };

  if (!useSkia) {
    return (
      <View style={style}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={facing}
          isActive={isActive}
          outputs={[photoOutput, videoOutput]}
          zoom={zoom}
          torchMode={torchMode}
          onError={handleError}
        />
      </View>
    );
  }

  return (
    <SkiaCamera
      ref={skiaRef}
      style={style}
      device={facing}
      isActive={isActive}
      outputs={[videoOutput]}
      zoom={zoom}
      torchMode={torchMode}
      onError={(error) => {
        handleError(error);
        // Errors before the first frame mean the Skia pipeline itself failed
        if (framesDrawn.value === 0) fallBack(error);
      }}
      onFrame={(frame, render) => {
        'worklet';
        render(({ canvas, frameTexture }) => {
          if (passthrough.value) {
            canvas.drawImage(frameTexture, 0, 0);
          } else {
            const imageShader = frameTexture.makeShaderOptions(
              TileMode.Clamp,
              TileMode.Clamp,
              FilterMode.Linear,
              MipmapMode.None,
            );
            const u = uniforms.value;
            const shader = filterEffect.makeShaderWithChildren(
              [...u, frameTexture.width(), frameTexture.height()],
              [imageShader],
            );
            paint.setShader(shader);
            canvas.drawImage(frameTexture, 0, 0, paint);
          }
        });
        // Only the first frame matters (black-screen guard) — don't write every frame
        if (framesDrawn.value === 0) framesDrawn.value = 1;
        frame.dispose();
      }}
    />
  );
});

export default FilterCamera;
