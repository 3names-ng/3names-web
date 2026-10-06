import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { FilterParams } from '@/constants/cameraFilters';
import { cssFilterOf } from '@/utils/cssFilter';
import WebFilterLayers from './webFilterLayers';

/**
 * Web version of filteredImage.tsx: the image through the browser's CSS
 * filters plus tint/fade/vignette layers, instead of the Skia shader.
 * Fills its container like `resizeMode="cover"`.
 */
export default function FilteredImage({
  uri,
  filter,
  style,
}: {
  uri: string;
  filter: FilterParams;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[style, styles.clip]}>
      <View style={[StyleSheet.absoluteFill, { filter: cssFilterOf(filter) } as object]}>
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <WebFilterLayers filter={filter} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
