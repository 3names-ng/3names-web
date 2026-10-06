import React, { useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import type { CameraFilter } from '@/constants/cameraFilters';
import { cssFilterOf } from '@/utils/cssFilter';
import WebFilterLayers from './webFilterLayers';

const THUMB = 54;

/**
 * Web version of filterStrip.tsx's swatch: the same colourful sample, run
 * through the browser's CSS filters instead of the Skia shader.
 */
export function FilterThumb({ filter, size = THUMB }: { filter: CameraFilter; size?: number }) {
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <View style={[StyleSheet.absoluteFill, { filter: cssFilterOf(filter.params) } as object]}>
        <LinearGradient
          colors={['#2D9CDB', '#27AE60', '#F2C94C', '#EB5757', '#9B51E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* a soft "sun" so tint/contrast differences read clearly */}
        <View
          style={{
            position: 'absolute',
            left: size * 0.68 - size * 0.16,
            top: size * 0.32 - size * 0.16,
            width: size * 0.32,
            height: size * 0.32,
            borderRadius: size * 0.16,
            backgroundColor: 'rgba(255,255,255,0.55)',
          }}
        />
      </View>
      <WebFilterLayers filter={filter.params} />
    </View>
  );
}

/** Horizontal, TikTok-style filter picker (web version — see filterStrip.tsx). */
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
