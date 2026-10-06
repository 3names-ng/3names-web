import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { FilterParams } from '@/constants/cameraFilters';

/**
 * Rough live preview of a filter for cameras that can't run the real shader
 * (Expo Go, or when live filters fail to start): coloured washes laid over
 * the camera view. It only hints at the look — tints, sepia, fade and
 * brightness show; black & white and contrast can't. The real filter is
 * applied to the captured photo/video, and the preview screen shows it exactly.
 */
export default function FilterTintOverlay({ filter }: { filter: FilterParams }) {
  const layers: string[] = [];

  // Colour tint from the per-channel gain (e.g. warm = more red, less blue)
  const [r, g, b] = filter.gain;
  const tintStrength = Math.max(Math.abs(r - 1), Math.abs(g - 1), Math.abs(b - 1));
  if (tintStrength > 0) {
    const channel = (gain: number) => Math.round(Math.min(255, Math.max(0, 128 + (gain - 1) * 900)));
    layers.push(`rgba(${channel(r)}, ${channel(g)}, ${channel(b)}, ${Math.min(0.35, tintStrength * 2)})`);
  }
  if (filter.sepia > 0) layers.push(`rgba(112, 66, 20, ${0.35 * filter.sepia})`);
  if (filter.fade > 0) layers.push(`rgba(255, 255, 255, ${filter.fade * 0.8})`);
  if (filter.brightness > 0) layers.push(`rgba(255, 255, 255, ${filter.brightness * 0.9})`);
  if (filter.brightness < 0) layers.push(`rgba(0, 0, 0, ${-filter.brightness * 1.2})`);
  // Low saturation can't be shown live — a light grey wash hints at it
  if (filter.saturation < 0.6) layers.push(`rgba(128, 128, 128, ${(0.6 - filter.saturation) * 0.35})`);

  if (layers.length === 0) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {layers.map((color, i) => (
        <View key={i} style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
      ))}
    </View>
  );
}
