import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import type { FilterParams } from '@/constants/cameraFilters';
import { cssFilterOf } from '@/utils/cssFilter';
import WebFilterLayers from './webFilterLayers';

/**
 * Web version of filteredVideoPreview.tsx: the browser's video player with
 * CSS filters, instead of Skia drawing each frame through the shader.
 */
export default function FilteredVideoPreview({
  uri,
  filter,
  paused = false,
  muted = false,
}: {
  uri: string;
  filter: FilterParams;
  paused?: boolean;
  muted?: boolean;
}) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/immutability
      player.muted = muted;
      if (paused) player.pause();
      else player.play();
    } catch {
      // player released
    }
  }, [player, paused, muted]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.clip]}>
      <View style={[StyleSheet.absoluteFill, { filter: cssFilterOf(filter) } as object]}>
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      </View>
      <WebFilterLayers filter={filter} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', backgroundColor: '#000' },
});
