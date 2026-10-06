// components/FloatingComboButton.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Gifts } from './GiftGridItem';
import { useTheme } from '@/hooks/useTheme';
import { useGiftThumbnail } from '@/hooks/useGiftThumbnail';

import { ThemedText } from '../ui/ThemedText';

// Create an animated capable version of the SVG Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FloatingComboProps {
  gift: Gifts;
  coinBalance: number;
  onSend: (count: number) => void;
  /** Called when the combo window expires; passes the total gifts sent. */
  onTimeout: (count: number) => void;
  /** Called when the button is tapped while the balance can't cover another
   * of this gift, so the parent can open the picker for a cheaper one. */
  onLocked?: () => void;
}

const COMBO_WINDOW = 3000;
const BUTTON_SIZE = 64;
const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FloatingComboButton({ gift, coinBalance, onSend, onTimeout, onLocked }: FloatingComboProps) {
  const [comboCount, setComboCount] = useState(1);
  // Mirrors comboCount so the countdown timer always reports the latest
  // total (state reads in the timer closure would otherwise lag one tap).
  const comboCountRef = useRef(1);
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const activeTimer = useRef<Animated.CompositeAnimation | null>(null);

  const { colors } = useTheme();
  const canAfford = coinBalance >= gift.coins;
  // Video thumbnail of the gift, shown on the button. A spinner is shown
  // while it's being generated instead of the emoji icon.
  const { uri: thumb, loading: thumbLoading } = useGiftThumbnail(gift.videoUrl);

  useEffect(() => {
    startComboWindow();

    return () => {
      if (activeTimer.current) activeTimer.current.stop();
    };
  }, []);

  const startComboWindow = () => {
    if (activeTimer.current) activeTimer.current.stop();
    countdownAnim.setValue(1);

    activeTimer.current = Animated.timing(countdownAnim, {
      toValue: 0,
      duration: COMBO_WINDOW,
      useNativeDriver: false, // SVG styling props cannot leverage the native thread driver
    });

    activeTimer.current.start(({ finished }) => {
      if (finished) onTimeout(comboCountRef.current);
    });
  };

  const handlePress = () => {
    if (!canAfford) {
      // Out of coins for this specific gift — hand off to the parent so it
      // can open the picker and let the remaining balance go toward
      // something cheaper, instead of leaving the button dead.
      onLocked?.();
      return;
    }

    comboCountRef.current += 1;
    setComboCount(comboCountRef.current);
    onSend(comboCountRef.current);

    scaleAnim.setValue(0.85);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 60,
      useNativeDriver: true,
    }).start();

    startComboWindow();
  };

  const strokeDashoffset = countdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.floatingContainer}>
      <ThemedText style={[styles.comboText, { color: colors.text }]}>Tap to Combo!</ThemedText>
      <View style={styles.buttonWrapper}>
        <View style={styles.svgPositioner} pointerEvents="none">
          <Svg width={BUTTON_SIZE + 8} height={BUTTON_SIZE + 8} viewBox={`0 0 ${BUTTON_SIZE + 8} ${BUTTON_SIZE + 8}`}>
            {/* Background static circle track */}
            <Circle 
              cx={(BUTTON_SIZE + 8) / 2} 
              cy={(BUTTON_SIZE + 8) / 2} 
              r={RADIUS} 
              stroke={colors.border} 
              strokeWidth="4" 
              fill="transparent" 
            />
            {/* The active countdown ring draining away */}
            <AnimatedCircle
              cx={(BUTTON_SIZE + 8) / 2}
              cy={(BUTTON_SIZE + 8) / 2}
              r={RADIUS}
              stroke="#FE2C55"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${(BUTTON_SIZE + 8) / 2} ${(BUTTON_SIZE + 8) / 2})`}
            />
          </Svg>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.btn,
              !canAfford && { backgroundColor: colors.card }
            ]}
            onPress={handlePress}
            activeOpacity={0.85}
          >
            {thumbLoading ? (
              <ActivityIndicator size="small" color="#fff" style={styles.thumb} />
            ) : thumb ? (
              <Image
                source={{ uri: thumb }}
                style={[styles.thumb, !canAfford && styles.thumbDisabled]}
                resizeMode="cover"
              />
            ) : (
              <ThemedText style={styles.giftIcon}>{gift.icon}</ThemedText>
            )}
            <ThemedText style={[styles.counter, !canAfford && { color: colors.muted }]}>
              {canAfford ? `x${comboCount}` : '🔒'}
            </ThemedText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
  },
  comboText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginBottom: 4, 
    textShadowColor: 'rgba(0,0,0,0.15)', 
    textShadowOffset: { width: 1, height: 1 }, 
    textShadowRadius: 2 
  },
  buttonWrapper: { 
    width: BUTTON_SIZE + 8, 
    height: BUTTON_SIZE + 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  svgPositioner: { 
    position: 'absolute', 
    top: 0, 
    left: 0 
  },
  btn: { 
    width: BUTTON_SIZE, 
    height: BUTTON_SIZE, 
    borderRadius: BUTTON_SIZE / 2, 
    backgroundColor: '#FE2C55', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    marginBottom: 2,
  },
  thumbDisabled: {
    opacity: 0.45,
  },
  giftIcon: {
    fontSize: 24,
    marginBottom: 2,
  },
  counter: { 
    color: '#FFF', 
    fontSize: 13, 
    fontWeight: '900' 
  },
});