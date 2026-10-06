import React, { useEffect, useState } from "react";
import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  makeMutable,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";

/**
 * Shared skeleton building blocks.
 *
 * Every mounted skeleton reads one module-level pulse value, so all blocks on
 * screen fade in sync and only one animation runs no matter how many there are.
 * The pulse starts when the first skeleton mounts and stops when the last one
 * unmounts. With the OS "Reduce motion" setting on, blocks render static.
 */

const MIN_OPACITY = 0.45;
const PULSE_DURATION = 800;

const pulse = makeMutable(1);
let activeSkeletons = 0;

function retainPulse() {
  activeSkeletons += 1;
  if (activeSkeletons === 1) {
    pulse.value = MIN_OPACITY;
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }
}

function releasePulse() {
  activeSkeletons = Math.max(0, activeSkeletons - 1);
  if (activeSkeletons === 0) {
    cancelAnimation(pulse);
    pulse.value = 1;
  }
}

/** "default" follows the app theme; "onDark" is for dark surfaces like the feed. */
export type SkeletonTone = "default" | "onDark";

const ON_DARK_COLOR = "rgba(255, 255, 255, 0.14)";

interface SkeletonProps {
  width: DimensionValue;
  height: number;
  radius?: number;
  tone?: SkeletonTone;
  style?: StyleProp<ViewStyle>;
}

/** A single pulsing placeholder block. */
export function Skeleton({ width, height, radius = 8, tone = "default", style }: SkeletonProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    retainPulse();
    return releasePulse;
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 1 : pulse.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: tone === "onDark" ? ON_DARK_COLOR : colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** A round placeholder, e.g. for avatars. */
export function SkeletonCircle({
  size,
  tone,
  style,
}: {
  size: number;
  tone?: SkeletonTone;
  style?: StyleProp<ViewStyle>;
}) {
  return <Skeleton width={size} height={size} radius={size / 2} tone={tone} style={style} />;
}

/** Stacked text lines; the last line is shorter so it reads like a paragraph. */
export function SkeletonText({
  lines = 2,
  lineHeight = 12,
  gap = 6,
  width = "100%",
  lastLineWidth = "60%",
  tone,
  style,
}: {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  width?: DimensionValue;
  lastLineWidth?: DimensionValue;
  tone?: SkeletonTone;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ gap }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 && lines > 1 ? lastLineWidth : width}
          height={lineHeight}
          radius={lineHeight / 2}
          tone={tone}
        />
      ))}
    </View>
  );
}

/**
 * Wraps a skeleton layout so screen readers announce a single "Loading"
 * instead of walking through every placeholder block.
 */
export function SkeletonGroup({
  label = "Loading",
  style,
  children,
}: {
  label?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      {children}
    </View>
  );
}

/**
 * Returns true only once `loading` has stayed true for `delay` ms, so fast
 * responses never flash a skeleton for a split second.
 */
export function useDelayedLoading(loading: boolean, delay = 200) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setShow(true), delay);
    return () => {
      clearTimeout(timer);
      setShow(false);
    };
  }, [loading, delay]);

  return loading && show;
}
