import React, { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Group, Image, Paint, RuntimeShader, useImage } from '@shopify/react-native-skia';

import type { FilterParams } from '@/constants/cameraFilters';
import { filterEffect, filterUniformsObject } from './filterShader';

/**
 * An image (e.g. a video's thumbnail) drawn through a camera filter, so a
 * raw-recorded video previews with the look the server will give it.
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
  const image = useImage(uri);
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={style}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      {size.width > 0 && image && (
        <Canvas style={{ width: size.width, height: size.height }}>
          <Group
            layer={
              <Paint>
                <RuntimeShader source={filterEffect} uniforms={filterUniformsObject(filter, size.width, size.height)} />
              </Paint>
            }
          >
            <Image image={image} x={0} y={0} width={size.width} height={size.height} fit="cover" />
          </Group>
        </Canvas>
      )}
    </View>
  );
}
