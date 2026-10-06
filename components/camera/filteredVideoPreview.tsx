import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Group, Image, Paint, RuntimeShader, useVideo } from '@shopify/react-native-skia';

import type { FilterParams } from '@/constants/cameraFilters';
import { filterEffect, filterUniformsObject } from './filterShader';

/**
 * Plays a just-recorded video full-screen with a camera filter applied, so
 * the preview matches what viewers get once the server applies the same
 * (video-safe) filter on upload.
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
  const { width, height } = useWindowDimensions();
  const { currentFrame, rotation } = useVideo(uri, { looping: true, paused, volume: muted ? 0 : 1 });

  // Frames can arrive rotated (portrait video stored landscape); draw them upright
  const quarterTurn = rotation === 90 || rotation === 270;
  const drawW = quarterTurn ? height : width;
  const drawH = quarterTurn ? width : height;

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Group layer={<Paint><RuntimeShader source={filterEffect} uniforms={filterUniformsObject(filter, width, height)} /></Paint>}>
        <Group
          origin={{ x: width / 2, y: height / 2 }}
          transform={[{ rotate: (rotation * Math.PI) / 180 }]}
        >
          <Image
            image={currentFrame}
            x={(width - drawW) / 2}
            y={(height - drawH) / 2}
            width={drawW}
            height={drawH}
            fit="cover"
          />
        </Group>
      </Group>
    </Canvas>
  );
}
