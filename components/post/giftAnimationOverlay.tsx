import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing, Text } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ActiveGiftAnimation {
  id: string;
  icon: string;
  cost: number;
}

interface GiftAnimationOverlayProps {
  activeAnimations: ActiveGiftAnimation[];
  onAnimationComplete: (id: string) => void;
}

// Helper function to define visual profiles per coin tier
function getGiftConfig(cost: number) {
  if (cost >= 4000) {
    return {
      type: 'LEGENDARY',
      baseDuration: 5500, // 5.5 seconds center stage display
      baseScale: 3.2,
      glowColor: 'rgba(234, 179, 8, 0.25)', // Rich Gold
      behavior: 'CENTER_STAGE',
    };
  } else if (cost >= 500) {
    return {
      type: 'ELITE',
      baseDuration: 4500, // 4.5 seconds majestic float
      baseScale: 1.8,
      glowColor: 'rgba(168, 85, 247, 0.25)', // Deep Purple
      behavior: 'GIANT_DRIFT',
    };
  } else if (cost >= 50) {
    return {
      type: 'HYPE',
      baseDuration: 3500, // 3.5 seconds clear wave drift
      baseScale: 1.2,
      glowColor: 'rgba(59, 130, 246, 0.15)', // Electric Blue
      behavior: 'STANDARD_SWARM',
    };
  } else {
    return {
      type: 'CLASSIC',
      baseDuration: 2800, // 2.8 seconds fast stream sprint
      baseScale: 0.7,
      glowColor: 'transparent',
      behavior: 'FAST_STREAM',
    };
  }
}

// Individual Particle Component built with native Animated API
function GiftParticle({
  gift,
  onComplete,
}: {
  gift: ActiveGiftAnimation;
  onComplete: (id: string) => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const config = getGiftConfig(gift.cost);

  // Pre-calculated random seeds
  const randomXStart = useRef(
    SCREEN_WIDTH * 0.2 + Math.random() * (SCREEN_WIDTH * 0.4)
  ).current;
  const driftDistance = useRef(Math.random() * 120 - 60).current;
  const waveFrequency = useRef(2 + Math.random() * 3).current;
  const waveAmplitude = useRef(
    config.behavior === 'GIANT_DRIFT' ? 45 : 15 + Math.random() * 15
  ).current;
  const randomRotationSeed = useRef(Math.random() * 720 - 360).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: config.baseDuration,
      easing:
        config.behavior === 'CENTER_STAGE'
          ? Easing.inOut(Easing.quad)
          : Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onComplete(gift.id);
      }
    });
  }, []);

  // Center Stage Keyframe Interpolations
  const translateYCenterStage = progress.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [
      SCREEN_HEIGHT * 0.7,
      SCREEN_HEIGHT * 0.4,
      SCREEN_HEIGHT * 0.4 - 12,
      SCREEN_HEIGHT * 0.4 + 12,
      -SCREEN_HEIGHT * 0.2,
    ],
  });

  const translateXCenterStage = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH * 0.5, SCREEN_WIDTH * 0.5],
  });

  const scaleCenterStage = progress.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [
      0,
      config.baseScale,
      config.baseScale + 0.3,
      config.baseScale,
      config.baseScale * 0.7,
    ],
  });

  const rotateCenterStage = progress.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [
      '0deg',
      '0deg',
      `${randomRotationSeed}deg`,
      `${randomRotationSeed}deg`,
    ],
  });

  const opacityCenterStage = progress.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  // Floating / Drift Interpolations
  const translateYDrift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT * 0.75, 0],
  });

  // Replaces Math.sin logic with native multi-point keyframe steps for wave oscillation
  const translateXDrift = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      randomXStart,
      randomXStart + driftDistance * 0.25 + waveAmplitude,
      randomXStart + driftDistance * 0.5 - waveAmplitude,
      randomXStart + driftDistance * 0.75 + waveAmplitude,
      randomXStart + driftDistance,
    ],
  });

  const scaleDrift = progress.interpolate({
    inputRange: [0, 0.1, 0.25, 1],
    outputRange: [
      0,
      config.baseScale * 1.3,
      config.baseScale,
      config.baseScale * 0.5,
    ],
  });

  const rotateDrift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${randomRotationSeed * 0.4}deg`],
  });

  const opacityDrift = progress.interpolate({
    inputRange: [0, 0.08, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  // Select properties according to behavior
  const isCenterStage = config.behavior === 'CENTER_STAGE';

  const animatedStyle = {
    transform: [
      { translateX: isCenterStage ? translateXCenterStage : translateXDrift },
      { translateY: isCenterStage ? translateYCenterStage : translateYDrift },
      { scale: isCenterStage ? scaleCenterStage : scaleDrift },
      { rotate: isCenterStage ? rotateCenterStage : rotateDrift },
    ],
    opacity: isCenterStage ? opacityCenterStage : opacityDrift,
  };

  return (
    <Animated.Text style={[styles.animatedEmoji, animatedStyle]}>
      {gift.icon}
    </Animated.Text>
  );
}

export function GiftAnimationOverlay({
  activeAnimations,
  onAnimationComplete,
}: GiftAnimationOverlayProps) {
  const ambientGlowOpacity = useRef(new Animated.Value(0)).current;
  const [glowColor, setGlowColor] = React.useState('rgba(124, 58, 237, 0.0)');

  useEffect(() => {
    if (activeAnimations.length > 0) {
      const latestGift = activeAnimations[activeAnimations.length - 1];
      const config = getGiftConfig(latestGift.cost);

      if (config.glowColor !== 'transparent') {
        setGlowColor(config.glowColor);

        const timingConfig =
          latestGift.cost >= 4000
            ? { flashIn: 300, hold: 3200, fadeOut: 1500, opacity: 0.7 }
            : { flashIn: 200, hold: 1200, fadeOut: 1000, opacity: 0.4 };

        // Replaces withSequence/withDelay with native Animated.sequence
        Animated.sequence([
          Animated.timing(ambientGlowOpacity, {
            toValue: timingConfig.opacity,
            duration: timingConfig.flashIn,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(timingConfig.hold),
          Animated.timing(ambientGlowOpacity, {
            toValue: 0,
            duration: timingConfig.fadeOut,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [activeAnimations.length]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" className="z-50">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: glowColor,
            opacity: ambientGlowOpacity,
          },
        ]}
      />
      {activeAnimations.map((gift) => (
        <GiftParticle
          key={gift.id}
          gift={gift}
          onComplete={onAnimationComplete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  animatedEmoji: {
    position: 'absolute',
    fontSize: 54,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    textAlign: 'center',
    left: -27,
    top: -27,
  },
});