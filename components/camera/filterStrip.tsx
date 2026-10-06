import React, { useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Fill, LinearGradient, Shader, vec } from '@shopify/react-native-skia';

import type { CameraFilter } from '@/constants/cameraFilters';
import { filterEffect, filterUniformsObject } from './filterShader';

const THUMB = 54;

/**
 * A colourful sample swatch run through the filter shader, so each
 * thumbnail previews the filter's look (warm, mono, punchy…).
 */
export function FilterThumb({ filter, size = THUMB }: { filter: CameraFilter; size?: number }) {
  return (
    <Canvas style={{ width: size, height: size }}>
      <Fill>
        <Shader source={filterEffect} uniforms={filterUniformsObject(filter.params, size, size)}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(size, size)}
            colors={['#2D9CDB', '#27AE60', '#F2C94C', '#EB5757', '#9B51E0']}
          />
        </Shader>
      </Fill>
      {/* a soft "sun" so tint/contrast differences read clearly */}
      <Circle cx={size * 0.68} cy={size * 0.32} r={size * 0.16} color="rgba(255,255,255,0.55)" />
    </Canvas>
  );
}

/** Horizontal, TikTok-style filter picker shown above the capture controls. */
export default function FilterStrip({
  filters,
  selectedId,
  onSelect,
}: {
  filters: CameraFilter[];
  selectedId: string;
  onSelect: (filter: CameraFilter) => void;
}) {
  const listRef = useRef<FlatList<CameraFilter>>(null);
  const index = Math.max(0, filters.findIndex((f) => f.id === selectedId));

  // Keep the selected filter in view (also when chosen by swiping the screen)
  useEffect(() => {
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }, [index]);

  return (
    <FlatList
      ref={listRef}
      horizontal
      data={filters}
      keyExtractor={(f) => f.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      getItemLayout={(_, i) => ({ length: THUMB + 16, offset: (THUMB + 16) * i, index: i })}
      onScrollToIndexFailed={() => {}}
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        return (
          <Pressable onPress={() => onSelect(item)} style={styles.item}>
            <View style={[styles.ring, selected && styles.ringSelected]}>
              <View style={styles.thumbClip}>
                <FilterThumb filter={item} />
              </View>
            </View>
            <Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>
              {item.name}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, gap: 0 },
  item: { width: THUMB + 16, alignItems: 'center' },
  ring: { width: THUMB + 6, height: THUMB + 6, borderRadius: (THUMB + 6) / 2, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  ringSelected: { borderColor: '#fff' },
  thumbClip: { width: THUMB, height: THUMB, borderRadius: THUMB / 2, overflow: 'hidden' },
  label: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 4, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
  labelSelected: { color: '#fff', fontWeight: '800' },
});
