import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

/**
 * Minimal horizontal slider (0–1) built on PanResponder — no extra native
 * dependency. `onChange` fires while dragging, `onComplete` on release.
 * `windowFraction` draws a highlighted span after the thumb (e.g. the 30s clip).
 */
export default function SimpleSlider({
  value,
  onChange,
  onComplete,
  windowFraction = 0,
  style,
}: {
  value: number;
  onChange: (value: number) => void;
  onComplete?: (value: number) => void;
  windowFraction?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startValueRef = useRef(0);
  const lastRef = useRef(value);
  // The responder is created once, so it reads the latest callbacks via refs
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Keep the gesture even if a parent scroll view wants it
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const w = widthRef.current || 1;
        // Tap jumps the thumb to the touch point
        const v = clamp(evt.nativeEvent.locationX / w);
        startValueRef.current = v;
        lastRef.current = v;
        onChangeRef.current(v);
      },
      onPanResponderMove: (_, gesture) => {
        const w = widthRef.current || 1;
        const v = clamp(startValueRef.current + gesture.dx / w);
        lastRef.current = v;
        onChangeRef.current(v);
      },
      onPanResponderRelease: () => onCompleteRef.current?.(lastRef.current),
      onPanResponderTerminate: () => onCompleteRef.current?.(lastRef.current),
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const thumbX = clamp(value) * width;
  const windowWidth = Math.min(width - thumbX, windowFraction * width);

  return (
    <View style={[styles.touch, style]} onLayout={onLayout} {...responder.panHandlers}>
      <View style={[styles.track, { backgroundColor: colors.border }]} />
      <View style={[styles.fill, { width: thumbX, backgroundColor: colors.primary }]} />
      {windowFraction > 0 && (
        <View style={[styles.window, { left: thumbX, width: Math.max(0, windowWidth), backgroundColor: colors.primary + '45' }]} />
      )}
      <View style={[styles.thumb, { left: thumbX - 11, backgroundColor: colors.primary, borderColor: colors.card }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  touch: { height: 36, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3 },
  fill: { position: 'absolute', height: 6, borderRadius: 3, left: 0 },
  window: { position: 'absolute', height: 14, borderRadius: 4 },
  thumb: { position: 'absolute', width: 22, height: 22, borderRadius: 11, borderWidth: 3 },
});
