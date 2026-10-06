"use client";

import React, { forwardRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon, LucideProps } from "lucide-react";

export type NativeLucideProps = Omit<LucideProps, "style"> & {
  style?: StyleProp<ViewStyle & Record<string, unknown>>;
};

/**
 * lucide-react-native takes React Native styles (arrays, transform lists),
 * which a DOM <svg> can't. When a style is given, it's applied to a wrapping
 * react-native-web View instead.
 */
export function wrapIcon(Icon: LucideIcon) {
  const Wrapped = forwardRef<SVGSVGElement, NativeLucideProps>(({ style, ...props }, ref) => {
    const svg = <Icon ref={ref} {...props} />;
    if (!style) return svg;
    return <View style={[{ alignItems: "center", justifyContent: "center" }, style]}>{svg}</View>;
  });
  Wrapped.displayName = Icon.displayName;
  return Wrapped;
}
