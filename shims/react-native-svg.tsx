// Minimal react-native-svg for the browser: each primitive renders the
// matching DOM SVG element. React DOM already accepts react-native-svg's
// camelCase attribute names (strokeWidth, patternUnits, stopColor, ...), so
// props pass straight through; only RN `style` arrays and `onPress` need mapping.
"use client";

import React, { forwardRef, type ReactNode } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type SvgProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  [key: string]: any;
};

function toDomProps({ style, onPress, ...rest }: SvgProps) {
  const out: Record<string, any> = rest;
  if (style) out.style = StyleSheet.flatten(style);
  if (onPress) out.onClick = onPress;
  return out;
}

function primitive<T extends keyof React.JSX.IntrinsicElements>(tag: T, displayName: string) {
  const C = forwardRef<SVGElement, SvgProps>((props, ref) =>
    React.createElement(tag, { ...toDomProps(props), ref })
  );
  C.displayName = displayName;
  return C;
}

const Svg = forwardRef<SVGSVGElement, SvgProps>(({ width, height, ...props }, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={width ?? "100%"}
    height={height ?? "100%"}
    {...toDomProps(props)}
    ref={ref}
  />
));
Svg.displayName = "Svg";

export const Circle = primitive("circle", "Circle");
export const ClipPath = primitive("clipPath", "ClipPath");
export const Defs = primitive("defs", "Defs");
export const Ellipse = primitive("ellipse", "Ellipse");
export const G = primitive("g", "G");
export const Line = primitive("line", "Line");
export const LinearGradient = primitive("linearGradient", "LinearGradient");
export const Mask = primitive("mask", "Mask");
export const Path = primitive("path", "Path");
export const Pattern = primitive("pattern", "Pattern");
export const Polygon = primitive("polygon", "Polygon");
export const Polyline = primitive("polyline", "Polyline");
export const RadialGradient = primitive("radialGradient", "RadialGradient");
export const Rect = primitive("rect", "Rect");
export const Stop = primitive("stop", "Stop");
export const Text = primitive("text", "Text");
export const TSpan = primitive("tspan", "TSpan");
export const Use = primitive("use", "Use");
export { Svg };
export default Svg;
