import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { FilterParams } from '@/constants/cameraFilters';
import { fadeColorOf, tintColorOf } from '@/utils/cssFilter';

/**
 * Web only: the parts of a filter CSS `filter` can't do — colour tint, fade
 * and vignette — laid over the (CSS-filtered) image or video.
 */
export default function WebFilterLayers({ filter }: { filter: FilterParams }) {
  const tint = tintColorOf(filter);
  const fade = fadeColorOf(filter);
  return (
    <>
      {tint && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />}
      {fade && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fade }]} />}
      {filter.vignette > 0 && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            // react-native-web passes CSS through; darkens the corners
            { backgroundImage: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,${(filter.vignette * 0.7).toFixed(2)}) 100%)` } as object,
          ]}
        />
      )}
    </>
  );
}
