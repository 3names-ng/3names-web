import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Sound } from '@/service/sound.service';

/** "♪ Title · Artist" line shown under a post's caption (white, for dark media overlays). */
export function SoundLabel({ sound, onPress }: { sound: Sound; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.label}>
      <Ionicons name="musical-notes" size={14} color="#fff" />
      <Text numberOfLines={1} style={styles.labelText}>
        {sound.title} · {sound.artistName}
      </Text>
    </Pressable>
  );
}

/** The spinning record with the cover art, like TikTok's. Spins only while playing. */
export function SoundDisc({ sound, spinning, onPress, size = 44 }: { sound: Sound; spinning: boolean; onPress?: () => void; size?: number }) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) {
      rotation.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
    );
    rotation.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [spinning, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const inner = size * 0.62;

  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View style={[styles.disc, { width: size, height: size, borderRadius: size / 2, transform: [{ rotate }] }]}>
        {sound.coverUrl ? (
          <Image source={{ uri: sound.coverUrl }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
        ) : (
          <View style={[styles.discFallback, { width: inner, height: inner, borderRadius: inner / 2 }]}>
            <Ionicons name="musical-note" size={inner * 0.55} color="#fff" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, maxWidth: '92%' },
  labelText: { color: '#fff', fontSize: 13, fontWeight: '600', flexShrink: 1 },
  disc: {
    backgroundColor: '#1a1a1a',
    borderWidth: 6,
    borderColor: '#2b2b2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discFallback: { backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
});
