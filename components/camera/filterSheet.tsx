import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CameraFilter } from '@/constants/cameraFilters';
import { FilterThumb } from './filterStrip';

const COLUMNS = 4;
const SHEET_HEIGHT = 380;

/**
 * Bottom sheet with every filter, opened from the camera's filter button
 * (TikTok-style). It's drawn inside the camera screen rather than as a Modal
 * so the live camera stays visible — and running — above it while choosing.
 */
export default function FilterSheet({
  visible,
  onClose,
  filters,
  selectedId,
  onSelect,
  approximate = false,
  videoMode = false,
}: {
  visible: boolean;
  onClose: () => void;
  filters: CameraFilter[];
  selectedId: string;
  onSelect: (filter: CameraFilter) => void;
  /** The camera can only approximate filters live (Expo Go) */
  approximate?: boolean;
  /** Video mode only offers filters that can be applied to video */
  videoMode?: boolean;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;
  // Stay mounted through the closing animation
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(slide, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished && !visible) setMounted(false);
      },
    );
  }, [visible, slide]);

  if (!mounted) return null;

  const itemWidth = (width - 24) / COLUMNS;
  const thumb = Math.min(64, itemWidth - 18);
  const height = SHEET_HEIGHT + insets.bottom;
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Tap the camera above the sheet to close it */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <Animated.View style={[styles.sheet, { height, paddingBottom: insets.bottom, transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="checkmark" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {(videoMode || approximate) && (
          <Text style={styles.note}>
            {videoMode ? 'Showing filters available for video. ' : ''}
            {approximate ? 'The camera preview is approximate here — the real filter is applied to what you capture.' : ''}
          </Text>
        )}

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {filters.map((item) => {
            const selected = item.id === selectedId;
            return (
              <Pressable key={item.id} onPress={() => onSelect(item)} style={[styles.item, { width: itemWidth }]}>
                <View
                  style={[
                    styles.ring,
                    { width: thumb + 6, height: thumb + 6, borderRadius: 14 },
                    selected && styles.ringSelected,
                  ]}
                >
                  <View style={{ width: thumb, height: thumb, borderRadius: 11, overflow: 'hidden' }}>
                    <FilterThumb filter={item} size={thumb} />
                  </View>
                  {selected && (
                    <View style={styles.check}>
                      <Ionicons name="checkmark" size={12} color="#000" />
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>
                  {item.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18,18,18,0.96)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '800' },
  note: { color: 'rgba(255,255,255,0.6)', fontSize: 11, paddingHorizontal: 16, paddingBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 12 },
  item: { alignItems: 'center', paddingVertical: 8 },
  ring: { borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  ringSelected: { borderColor: '#fff' },
  check: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 5, fontWeight: '600' },
  labelSelected: { color: '#fff', fontWeight: '800' },
});
