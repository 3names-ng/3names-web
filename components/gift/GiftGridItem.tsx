// components/GiftGridItem.tsx
//
// A single gift tile. Visual weight scales with rarity:
//   common    – flat card, no motion, no glow
//   rare      – colored border + slow breathing glow pulse
//   epic      – gradient card + gentle wobble/rotate loop
//   legendary – gradient card + rotating glow ring + shimmer sweep
//
// All animation loops use the native driver where possible and are
// started/stopped based on visibility so idle offscreen gifts don't
// burn cycles.

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRarityConfig } from './rarityStyles';
import { useGiftThumbnail } from '@/hooks/useGiftThumbnail';

// Define the shape of the gift data passed down to this component
export interface Gifts {
  id: string | number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | string;
  icon: string;
  name: string;
  coins: number;
  animationUrl:string
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
}

// Define the configuration structure returned by your rarity engine
export interface RarityConfig {
  animation: 'none' | 'pulse' | 'wobble' | 'shimmer' | string;
  glowColor?: string;
  borderColor: string;
  gradient: [string, string, ...string[]];
  label?: string;
  badgeColor?: string;
  coinColor: string;
}

interface GiftGridItemProps {
  gift: Gifts;
  selected: boolean;
  onPress: (gift: Gifts) => void;
}

export default function GiftGridItem({ gift, selected, onPress }: GiftGridItemProps) {
  // Cast or infer the config shape based on your style schema
  const config = getRarityConfig(gift.rarity) as RarityConfig;

  // Video thumbnail used as the gift's icon — generated once per videoUrl
  // and cached in the store, so reopening the sheet reuses it. A spinner is
  // shown while it's being generated instead of the emoji icon.
  const { uri: displayThumb, loading: thumbLoading } = useGiftThumbnail(
    gift.videoUrl,
  );

  const pulse = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let activeLoops: Animated.CompositeAnimation[] = [];

    if (config.animation === 'pulse') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      activeLoops.push(pulseLoop);
    } else if (config.animation === 'wobble') {
      const wobbleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(wobble, { toValue: -1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(wobble, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      activeLoops.push(wobbleLoop);
    } else if (config.animation === 'shimmer') {
      const rotateLoop = Animated.loop(
        Animated.timing(ringRotate, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
      );
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      activeLoops.push(rotateLoop, shimmerLoop);
    }

    // Fire off all registered animation sequences simultaneously
    activeLoops.forEach(loop => loop.start());

    // Clean up loop arrays properly to avoid rogue background animation tickers
    return () => {
      activeLoops.forEach(loop => loop.stop());
    };
  }, [config.animation, pulse, wobble, ringRotate, shimmer]);

  const handlePressIn = () => {
    Animated.spring(pressScale, { toValue: 0.92, useNativeDriver: true, speed: 40 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  };

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.75] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const rotateZ = wobble.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });
  const ringSpin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

  return (
    <Pressable
      onPress={() => onPress(gift)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.wrapper}
    >
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        {/* Glow layer behind the card, only visible for rare+ */}
        {config.animation === 'pulse' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.glow,
              { backgroundColor: config.glowColor, opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
        )}
        {config.animation === 'shimmer' && (
          <Animated.View
            pointerEvents="none"
            style={[styles.ring, { borderColor: config.glowColor, transform: [{ rotate: ringSpin }] }]}
          />
        )}

        <LinearGradient
          colors={config.gradient}
          style={[
            styles.card,
            { borderColor: selected ? '#FFFFFF' : config.borderColor },
            selected && styles.cardSelected,
          ]}
        >
          {/* {config.label && (
            <View style={[styles.badge, { backgroundColor: config.badgeColor }]}>
              <Text style={styles.badgeText}>{config.label}</Text>
            </View>
          )} */}

          <View style={styles.mediaBox}>
            {thumbLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : displayThumb ? (
              <Image
                source={{ uri: displayThumb }}
                style={styles.videoThumb}
                resizeMode="cover"
              />
            ) : (
              <Animated.Text
                style={[
                  styles.icon,
                  config.animation === 'wobble' && { transform: [{ rotate: rotateZ }] },
                ]}
              >
                {gift.icon}
              </Animated.Text>
            )}
          </View>

          {config.animation === 'shimmer' && (
            <Animated.View pointerEvents="none" style={[styles.shimmerSweep, { opacity: shimmerOpacity }]} />
          )}

          <Text style={styles.name} numberOfLines={1}>{gift.name}</Text>

          <View style={styles.coinRow}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={[styles.coinText, { color: config.coinColor }]}>{gift.coins.toLocaleString()}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '25%',
    padding: 6,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    // Taller than it is wide, with room reserved below the media for the
    // name + coin cost so they never get clipped by overflow: 'hidden'.
    aspectRatio: 0.7,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  cardSelected: {
    borderWidth: 2,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  ring: {
    position: 'absolute',
    top: -6,
    left: '10%',
    width: '80%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  shimmerSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '45%',
    width: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
    transform: [{ rotate: '20deg' }],
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  // Fixed-size slot shared by the emoji icon, the loading spinner, and the
  // video thumbnail, so the media above the name/coin row is always the
  // same height regardless of which one renders.
  mediaBox: {
    width: '68%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 30,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  name: {
    color: '#EDEDF2',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    marginBottom: 2,
  },
  coinIcon: {
    fontSize: 10,
    marginRight: 3,
  },
  coinText: {
    fontSize: 12,
    fontWeight: '700',
  },
});