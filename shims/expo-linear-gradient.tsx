import React from "react";
import { View } from "react-native";

type Color = string;
// expo-linear-gradient accepts { x, y } objects or [x, y] tuples.
type Point = { x: number; y: number } | readonly [number, number] | number[] | null;

export interface LinearGradientProps {
  colors?: Color[] | readonly Color[];
  locations?: number[] | readonly number[] | null;
  start?: Point;
  end?: Point;
  style?: any;
  children?: React.ReactNode;
  pointerEvents?: string;
  [key: string]: any;
}

function toPercent(n: number) {
  return `${Math.round(n * 10000) / 100}%`;
}

function toXY(p: Point | undefined, fallback: [number, number]): [number, number] {
  if (!p) return fallback;
  if (Array.isArray(p)) return [Number(p[0]), Number(p[1])];
  const o = p as { x: number; y: number };
  return [o.x, o.y];
}

function directionFor(start?: Point, end?: Point): string {
  // expo defaults: start { x: 0.5, y: 0 }, end { x: 0.5, y: 1 } (top -> bottom)
  const s = toXY(start, [0.5, 0]);
  const e = toXY(end, [0.5, 1]);
  const dx = e[0] - s[0];
  const dy = e[1] - s[1];
  if (dx === 0 && dy === 0) return "to bottom";
  // CSS angle: 0deg = to top, 90deg = to right. RN: y grows downward.
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return `${Math.round(angle)}deg`;
}

/**
 * CSS linear-gradient behind a View so className/children keep working.
 */
export function LinearGradient({
  colors = ["transparent", "transparent"],
  locations,
  start,
  end,
  style,
  children,
  ...rest
}: LinearGradientProps) {
  const colorList = (Array.isArray(colors) ? colors : []) as string[];
  const stops = colorList.map((c, i) => {
    const loc = locations && locations[i] != null ? locations[i] : i / Math.max(colorList.length - 1, 1);
    return `${c} ${toPercent(loc)}`;
  });
  const backgroundImage = `linear-gradient(${directionFor(start, end)}, ${stops.join(", ")})`;

  const restProps: Record<string, any> = { ...rest };
  delete restProps.pointerEvents;
  delete restProps.onLayout;

  return (
    <View style={style} pointerEvents={(rest as any).pointerEvents} {...restProps}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage,
        }}
      />
      {children}
    </View>
  );
}

export default LinearGradient;
