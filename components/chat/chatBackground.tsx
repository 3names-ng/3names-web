// Renders a chat wallpaper: a solid color, a tiled SVG pattern, or a
// user-picked photo. Shared by the group chat and direct-message screens so
// the user's selected background looks identical everywhere.

import React from "react";
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Pattern,
  Rect,
} from "react-native-svg";
import type { ChatBackgroundPreset } from "./chatBackgrounds";

interface ChatBackgroundProps {
  preset: ChatBackgroundPreset;
  isDark: boolean;
  /**
   * Sizing style. Pass StyleSheet.absoluteFill for the chat screen, or
   * a fixed width/height for preview swatches.
   */
  style?: StyleProp<ViewStyle>;
  /** Photo URI used when preset.kind === "image" */
  imageUri?: string | null;
}

export function ChatBackground({
  preset,
  isDark,
  style,
  imageUri,
}: ChatBackgroundProps) {
  // User-picked photo
  if (preset.kind === "image") {
    if (imageUri) {
      return (
        <Image
          source={{ uri: imageUri }}
          resizeMode="cover"
          style={
            [
              style,
              { backgroundColor: isDark ? "#0B141A" : "#E4DDD3" },
            ] as StyleProp<ImageStyle>
          }
        />
      );
    }
    // No photo chosen yet — neutral placeholder tint
    const baseColor = isDark ? "#0B141A" : "#E4DDD3";
    return (
      <View
        pointerEvents="none"
        style={[style, { backgroundColor: baseColor }]}
      />
    );
  }

  const baseColor = isDark ? preset.darkColor : preset.lightColor;

  // Solid color — no SVG needed
  if (preset.kind === "color" || !preset.pattern) {
    return (
      <View
        pointerEvents="none"
        style={[style, { backgroundColor: baseColor }]}
      />
    );
  }

  const accent = isDark
    ? preset.darkPatternColor || "#FFFFFF"
    : preset.lightPatternColor || "#000000";
  const opacity = isDark
    ? preset.darkPatternOpacity ?? 0.08
    : preset.lightPatternOpacity ?? 0.1;
  const tileSize = preset.patternTileSize || 90;
  const patternId = `chatBgPattern-${preset.key}`;

  return (
    <View
      style={style}
      pointerEvents="none"
      collapsable={false}
    >
    <Svg
      width="100%"
      height="100%"
      style={{ width: "100%", height: "100%" }}
    >
      <Defs>
        <Pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width={tileSize}
          height={tileSize}
        >
          {preset.pattern === "doodle" && (
            // The authentic WhatsApp doodle: a scattering of hand-drawn
            // squiggles, spirals, sparkles, hearts, zigzags and dots on the
            // classic beige/charcoal base. Tile is 180x180 to match the
            // density of the real wallpaper.
            <>
              {/* wavy squiggle */}
              <Path
                d="M12 20 Q 20 12 28 20 Q 36 28 44 20 Q 52 12 60 20"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* sparkle star */}
              <Path
                d="M0 -9 L2.6 -2.9 L9 -2.9 L4 1.2 L5.8 7.6 L0 3.9 L-5.8 7.6 L-4 1.2 L-9 -2.9 L-2.6 -2.9 Z"
                transform="translate(95 18) scale(1.05)"
                fill={accent}
              />
              {/* smile arc */}
              <Path
                d="M118 26 Q 130 34 142 26"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* small heart */}
              <Path
                d="M0 4 C0 0 -6 -2 -6 -6 C-6 -10 -2 -10 0 -7 C2 -10 6 -10 6 -6 C6 -2 0 0 0 4 Z"
                transform="translate(162 20) scale(0.9)"
                fill={accent}
              />
              {/* spiral */}
              <Path
                d="M35 60 m 0 -5 a 5 5 0 1 1 -5 5 a 9 9 0 1 0 9 -9 a 13 13 0 1 1 -13 13"
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              {/* flower */}
              {[0, 72, 144, 216, 288].map((deg) => (
                <Circle
                  key={`d-fl-${deg}`}
                  cx={95 + 9 * Math.cos((deg * Math.PI) / 180)}
                  cy={60 + 9 * Math.sin((deg * Math.PI) / 180)}
                  r={4.5}
                  fill={accent}
                />
              ))}
              <Circle cx={95} cy={60} r={2.6} fill={accent} />
              {/* concentric rings */}
              <Circle
                cx={152}
                cy={60}
                r={9}
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
              />
              <Circle
                cx={152}
                cy={60}
                r={15}
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
              />
              {/* zigzag */}
              <Path
                d="M10 95 l 9 -9 l 9 9 l 9 -9 l 9 9 l 9 -9 l 9 9 l 9 -9 l 9 9"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* arrow */}
              <Path
                d="M 95 108 L 105 94 L 115 108 M 105 94 L 105 112"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* dotted dashes */}
              <Path
                d="M 132 102 h 7 M 143 102 h 7 M 154 102 h 7 M 165 102 h 7"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              {/* spring coil */}
              <Path
                d="M 25 120 q 7 6 0 12 q -7 6 0 12 q 7 6 0 12 q -7 6 0 12"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* flying birds */}
              <Path
                d="M 80 128 q 10 -12 20 0"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              <Path
                d="M 102 134 q 10 -12 20 0"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* plus sign */}
              <Path
                d="M 140 130 v 20 M 130 140 h 20"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* tiny heart */}
              <Path
                d="M0 4 C0 0 -6 -2 -6 -6 C-6 -10 -2 -10 0 -7 C2 -10 6 -10 6 -6 C6 -2 0 0 0 4 Z"
                transform="translate(172 150) scale(0.75)"
                fill={accent}
              />
              {/* scattered dots */}
              <Circle cx={70} cy={32} r={1.8} fill={accent} />
              <Circle cx={160} cy={82} r={1.8} fill={accent} />
              <Circle cx={55} cy={112} r={1.8} fill={accent} />
              <Circle cx={120} cy={168} r={1.8} fill={accent} />
              <Circle cx={14} cy={168} r={1.8} fill={accent} />
              <Circle cx={78} cy={170} r={1.8} fill={accent} />
            </>
          )}

          {preset.pattern === "dots" && (
            <>
              {[15, 45, 75].flatMap((cy) =>
                [15, 45, 75].map((cx) => (
                  <Circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={3.2}
                    fill={accent}
                  />
                )),
              )}
            </>
          )}

          {preset.pattern === "stripes" && (
            <>
              <Path d="M0 0 L45 45 L45 60 L0 15 Z" fill={accent} />
              <Path d="M0 45 L45 90 L30 90 L0 60 Z" fill={accent} />
            </>
          )}

          {preset.pattern === "waves" && (
            <>
              <Path
                d="M0 22 Q 12 10 24 22 Q 36 34 48 22 Q 60 10 72 22 Q 84 34 96 22"
                fill="none"
                stroke={accent}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
              <Path
                d="M0 67 Q 12 55 24 67 Q 36 79 48 67 Q 60 55 72 67 Q 84 79 96 67"
                fill="none"
                stroke={accent}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </>
          )}

          {preset.pattern === "zigzag" && (
            <>
              <Path
                d="M0 10 L22.5 32.5 L45 10 L67.5 32.5 L90 10"
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <Path
                d="M0 55 L22.5 77.5 L45 55 L67.5 77.5 L90 55"
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </>
          )}

          {preset.pattern === "grid" && (
            <>
              {[22.5, 45, 67.5].map((x) => (
                <Line
                  key={`v${x}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={90}
                  stroke={accent}
                  strokeWidth={1.2}
                />
              ))}
              {[22.5, 45, 67.5].map((y) => (
                <Line
                  key={`h${y}`}
                  x1={0}
                  y1={y}
                  x2={90}
                  y2={y}
                  stroke={accent}
                  strokeWidth={1.2}
                />
              ))}
            </>
          )}

          {preset.pattern === "chevron" && (
            <>
              <Path
                d="M15 20 L30 5 L45 20"
                fill="none"
                stroke={accent}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M60 20 L75 5 L90 20"
                fill="none"
                stroke={accent}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M15 65 L30 50 L45 65"
                fill="none"
                stroke={accent}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M60 65 L75 50 L90 65"
                fill="none"
                stroke={accent}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {preset.pattern === "hearts" && (
            <>
              <Path
                d="M0 4 C0 0 -6 -2 -6 -6 C-6 -10 -2 -10 0 -7 C2 -10 6 -10 6 -6 C6 -2 0 0 0 4 Z"
                transform="translate(22 22) scale(1.15)"
                fill={accent}
              />
              <Path
                d="M0 4 C0 0 -6 -2 -6 -6 C-6 -10 -2 -10 0 -7 C2 -10 6 -10 6 -6 C6 -2 0 0 0 4 Z"
                transform="translate(67 67) scale(1.15)"
                fill={accent}
              />
            </>
          )}

          {preset.pattern === "stars" && (
            <>
              <Path
                d="M0 -9 L2.6 -2.9 L9 -2.9 L4 1.2 L5.8 7.6 L0 3.9 L-5.8 7.6 L-4 1.2 L-9 -2.9 L-2.6 -2.9 Z"
                transform="translate(22 22) scale(1.05)"
                fill={accent}
              />
              <Path
                d="M0 -9 L2.6 -2.9 L9 -2.9 L4 1.2 L5.8 7.6 L0 3.9 L-5.8 7.6 L-4 1.2 L-9 -2.9 L-2.6 -2.9 Z"
                transform="translate(67 67) scale(1.05)"
                fill={accent}
              />
            </>
          )}

          {preset.pattern === "bloom" && (
            // Hand-drawn botanical doodles: daisies, stems, leaves and buds
            // in a soft sage green.
            <>
              {/* flower 1 */}
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <Circle
                  key={`b1-${deg}`}
                  cx={50 + 9 * Math.cos((deg * Math.PI) / 180)}
                  cy={55 + 9 * Math.sin((deg * Math.PI) / 180)}
                  r={5}
                  fill={accent}
                />
              ))}
              <Circle cx={50} cy={55} r={2.8} fill={accent} />
              {/* stem + leaf 1 */}
              <Path
                d="M50 64 Q 48 85 40 100"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Path
                d="M46 78 Q 58 74 64 84 Q 54 92 46 78 Z"
                fill={accent}
              />
              {/* flower 2 */}
              {[0, 72, 144, 216, 288].map((deg) => (
                <Circle
                  key={`b2-${deg}`}
                  cx={130 + 8 * Math.cos((deg * Math.PI) / 180)}
                  cy={100 + 8 * Math.sin((deg * Math.PI) / 180)}
                  r={4.2}
                  fill={accent}
                />
              ))}
              <Circle cx={130} cy={100} r={2.4} fill={accent} />
              {/* stem + leaf 2 */}
              <Path
                d="M130 108 Q 132 130 122 145"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Path
                d="M128 122 Q 140 118 146 128 Q 136 136 128 122 Z"
                fill={accent}
              />
              {/* bud + stem */}
              <Circle cx={88} cy={150} r={3.4} fill={accent} />
              <Path
                d="M88 153 Q 86 162 92 168"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* lone leaf */}
              <Path
                d="M12 30 Q 26 26 30 38 Q 18 44 12 30 Z"
                fill={accent}
              />
              {/* right-side stem + leaf */}
              <Path
                d="M168 20 Q 158 40 165 58"
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Path
                d="M164 38 Q 176 36 180 46 Q 170 52 164 38 Z"
                fill={accent}
              />
              {/* scattered dots */}
              <Circle cx={30} cy={120} r={2} fill={accent} />
              <Circle cx={105} cy={30} r={2} fill={accent} />
              <Circle cx={160} cy={150} r={2} fill={accent} />
            </>
          )}

          {preset.pattern === "scribble" && (
            // Dense flowing pen strokes, curls and loops — an abstract
            // hand-drawn sketch.
            <>
              <Path
                d="M8 30 Q 20 10 32 26 T 56 24 T 80 30 T 104 22 T 128 28 T 150 18 T 172 26"
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Path
                d="M14 70 Q 30 52 44 66 T 74 62 T 102 70 T 130 58 T 160 66"
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Path
                d="M10 110 Q 26 94 40 106 T 68 104 T 96 112 T 124 100 T 152 108 T 172 100"
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Path
                d="M20 150 Q 36 136 50 148 T 80 144 T 108 152 T 136 140 T 162 148"
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              {/* curls */}
              <Path
                d="M90 40 m 0 -4 a 4 4 0 1 1 -4 4 a 7 7 0 1 0 7 -7"
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              <Path
                d="M60 128 m 0 -4 a 4 4 0 1 1 -4 4 a 7 7 0 1 0 7 -7"
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              <Path
                d="M150 120 m 0 -4 a 4 4 0 1 1 -4 4 a 7 7 0 1 0 7 -7"
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              {/* loops */}
              <Path
                d="M40 20 q 10 -12 20 0 q -10 12 -20 0 Z"
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              <Path
                d="M120 90 q 12 -10 24 0 q -12 10 -24 0 Z"
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              <Path
                d="M30 168 q 10 -10 20 0 q -10 10 -20 0 Z"
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
            </>
          )}

          {preset.pattern === "bubbles" && (
            // Soap bubbles of different sizes with little shine highlights.
            <>
              <Circle
                cx={40}
                cy={40}
                r={18}
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
              />
              <Circle cx={40} cy={40} r={2.2} fill={accent} />
              <Path
                d="M 28 30 a 10 10 0 0 1 8 -4"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              <Circle
                cx={105}
                cy={70}
                r={26}
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
              />
              <Path
                d="M 90 54 a 12 12 0 0 1 10 -6"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              <Circle
                cx={60}
                cy={125}
                r={12}
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
              />
              <Circle cx={60} cy={125} r={2} fill={accent} />
              <Circle
                cx={140}
                cy={135}
                r={20}
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
              />
              <Path
                d="M 128 122 a 10 10 0 0 1 8 -4"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              <Circle
                cx={170}
                cy={55}
                r={10}
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
              />
              <Circle
                cx={30}
                cy={165}
                r={7}
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
              />
              <Circle
                cx={110}
                cy={160}
                r={5}
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
              />
              <Circle
                cx={160}
                cy={165}
                r={8}
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
              />
              {/* tiny dots */}
              <Circle cx={95} cy={30} r={2} fill={accent} />
              <Circle cx={150} cy={100} r={2} fill={accent} />
              <Circle cx={80} cy={160} r={1.8} fill={accent} />
            </>
          )}

          {preset.pattern === "confetti" && (
            // Festive mix of sparkles, hearts, dots, dashes and zigzags.
            <>
              <Path
                d="M0 -9 L2.6 -2.9 L9 -2.9 L4 1.2 L5.8 7.6 L0 3.9 L-5.8 7.6 L-4 1.2 L-9 -2.9 L-2.6 -2.9 Z"
                transform="translate(30 30) scale(1.1)"
                fill={accent}
              />
              <Path
                d="M0 -9 L2.6 -2.9 L9 -2.9 L4 1.2 L5.8 7.6 L0 3.9 L-5.8 7.6 L-4 1.2 L-9 -2.9 L-2.6 -2.9 Z"
                transform="translate(150 120) scale(0.85)"
                fill={accent}
              />
              <Path
                d="M0 4 C0 0 -6 -2 -6 -6 C-6 -10 -2 -10 0 -7 C2 -10 6 -10 6 -6 C6 -2 0 0 0 4 Z"
                transform="translate(115 35) scale(0.9)"
                fill={accent}
              />
              <Path
                d="M0 4 C0 0 -6 -2 -6 -6 C-6 -10 -2 -10 0 -7 C2 -10 6 -10 6 -6 C6 -2 0 0 0 4 Z"
                transform="translate(55 150) scale(0.7)"
                fill={accent}
              />
              <Circle cx={75} cy={70} r={4} fill={accent} />
              <Circle cx={150} cy={60} r={3} fill={accent} />
              <Circle cx={40} cy={100} r={3.4} fill={accent} />
              <Circle cx={100} cy={140} r={4} fill={accent} />
              <Circle cx={170} cy={95} r={3} fill={accent} />
              <Circle cx={125} cy={160} r={2.6} fill={accent} />
              <Path
                d="M 20 70 h 14 M 95 95 h 14 M 60 120 h 14 M 130 80 h 14 M 170 150 h 12"
                fill="none"
                stroke={accent}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              <Path
                d="M 75 165 l 7 -7 l 7 7 l 7 -7 l 7 7"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle
                cx={170}
                cy={35}
                r={6}
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
              />
              <Circle
                cx={20}
                cy={145}
                r={8}
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
              />
            </>
          )}

          {preset.pattern === "starry" && (
            // A night sky full of sparkle stars, scattered dots and a
            // shooting star, under a slim crescent moon.
            <>
              {/* crescent moon */}
              <Path
                d="M 150 30 A 12 12 0 1 0 150 54 A 10 10 0 1 1 150 30 Z"
                fill={accent}
              />
              {/* sparkle stars */}
              <Path
                d="M0 -9 L2.6 -2.9 L9 -2.9 L4 1.2 L5.8 7.6 L0 3.9 L-5.8 7.6 L-4 1.2 L-9 -2.9 L-2.6 -2.9 Z"
                transform="translate(40 40) scale(1.2)"
                fill={accent}
              />
              <Path
                d="M0 -9 L2.6 -2.9 L9 -2.9 L4 1.2 L5.8 7.6 L0 3.9 L-5.8 7.6 L-4 1.2 L-9 -2.9 L-2.6 -2.9 Z"
                transform="translate(95 105) scale(0.8)"
                fill={accent}
              />
              <Path
                d="M0 -9 L2.6 -2.9 L9 -2.9 L4 1.2 L5.8 7.6 L0 3.9 L-5.8 7.6 L-4 1.2 L-9 -2.9 L-2.6 -2.9 Z"
                transform="translate(60 150) scale(0.9)"
                fill={accent}
              />
              {/* shooting star */}
              <Path
                d="M 110 30 L 140 60"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Circle cx={140} cy={60} r={2.5} fill={accent} />
              {/* small dots */}
              <Circle cx={25} cy={80} r={2} fill={accent} />
              <Circle cx={70} cy={25} r={1.8} fill={accent} />
              <Circle cx={120} cy={80} r={2.2} fill={accent} />
              <Circle cx={160} cy={120} r={1.8} fill={accent} />
              <Circle cx={45} cy={115} r={1.6} fill={accent} />
              <Circle cx={140} cy={160} r={2} fill={accent} />
              <Circle cx={30} cy={165} r={1.6} fill={accent} />
              <Circle cx={170} cy={85} r={1.6} fill={accent} />
            </>
          )}

          {preset.pattern === "beach" && (
            // Warm sand with a smiling sun, a leaning palm tree, rolling
            // waves, a starfish and a scallop shell.
            <>
              {/* sun with rays */}
              <Circle
                cx={45}
                cy={45}
                r={12}
                fill="none"
                stroke={accent}
                strokeWidth={1.8}
              />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const a = (deg * Math.PI) / 180;
                return (
                  <Path
                    key={`sun-${deg}`}
                    d={`M ${45 + 17 * Math.cos(a)} ${45 + 17 * Math.sin(a)} l ${4 * Math.cos(a)} ${4 * Math.sin(a)}`}
                    stroke={accent}
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                );
              })}
              {/* palm tree */}
              <Path
                d="M 120 25 Q 100 55 85 100"
                fill="none"
                stroke={accent}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Path
                d="M 88 92 Q 102 78 118 82"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Path
                d="M 92 82 Q 106 68 122 72"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Path
                d="M 98 70 Q 108 58 122 60"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Path
                d="M 96 88 Q 84 78 82 92"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              {/* waves */}
              <Path
                d="M 15 130 Q 25 122 35 130 Q 45 138 55 130 Q 65 122 75 130"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Path
                d="M 85 140 Q 95 132 105 140 Q 115 148 125 140 Q 135 132 145 140"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              {/* starfish */}
              <Path
                d="M0 -10 L2.4 -3.2 L9.5 -3.1 L4 1.5 L5.9 8.1 L0 4.6 L-5.9 8.1 L-4 1.5 L-9.5 -3.1 L-2.4 -3.2 Z"
                transform="translate(40 120) scale(0.9)"
                fill={accent}
              />
              {/* scallop shell */}
              <Path
                d="M 150 122 Q 164 104 178 122 Z"
                fill={accent}
              />
              <Path
                d="M 164 106 L 154 120 M 164 106 L 164 120 M 164 106 L 174 120"
                stroke={isDark ? preset.darkColor : preset.lightColor}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* sand dots */}
              <Circle cx={70} cy={160} r={2} fill={accent} />
              <Circle cx={110} cy={165} r={1.8} fill={accent} />
              <Circle cx={145} cy={165} r={1.6} fill={accent} />
              <Circle cx={165} cy={80} r={1.8} fill={accent} />
            </>
          )}

          {preset.pattern === "night" && (
            // Moody night scene: a big crescent moon, soft clouds, mountain
            // silhouettes and a few stars.
            <>
              {/* big crescent moon */}
              <Path
                d="M 60 45 A 16 16 0 1 0 60 77 A 13 13 0 1 1 60 45 Z"
                fill={accent}
              />
              {/* soft cloud */}
              <Circle cx={45} cy={130} r={9} fill={accent} />
              <Circle cx={62} cy={124} r={11} fill={accent} />
              <Circle cx={80} cy={130} r={8} fill={accent} />
              <Rect x={36} y={130} width={52} height={10} rx={5} fill={accent} />
              {/* mountain silhouettes */}
              <Path d="M 10 165 L 42 118 L 74 165 Z" fill={accent} />
              <Path d="M 60 165 L 95 125 L 130 165 Z" fill={accent} />
              <Path d="M 112 165 L 140 134 L 172 165 Z" fill={accent} />
              {/* stars */}
              <Circle cx={25} cy={60} r={2} fill={accent} />
              <Circle cx={110} cy={40} r={1.8} fill={accent} />
              <Circle cx={150} cy={90} r={2.2} fill={accent} />
              <Circle cx={130} cy={150} r={1.6} fill={accent} />
              <Circle cx={90} cy={85} r={1.5} fill={accent} />
              <Circle cx={160} cy={55} r={1.6} fill={accent} />
              <Circle cx={170} cy={140} r={1.8} fill={accent} />
              <Path
                d="M0 -6 L1.8 -2 L6 -2 L2.7 0.8 L3.9 5 L0 2.6 L-3.9 5 L-2.7 0.8 L-6 -2 L-1.8 -2 Z"
                transform="translate(125 100)"
                fill={accent}
              />
            </>
          )}

          {preset.pattern === "forest" && (
            // Tall pines, rounded trees, a fern, a mushroom and scattered
            // leaves in soft greens.
            <>
              {/* pine tree (large) */}
              <Path d="M 45 30 L 32 52 L 58 52 Z" fill={accent} />
              <Path d="M 45 46 L 34 68 L 56 68 Z" fill={accent} />
              <Path
                d="M 45 68 v 8"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              {/* pine tree (small) */}
              <Path d="M 140 60 L 131 76 L 149 76 Z" fill={accent} />
              <Path d="M 140 70 L 133 86 L 147 86 Z" fill={accent} />
              <Path
                d="M 140 86 v 6"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* rounded tree */}
              <Circle cx={95} cy={95} r={13} fill={accent} />
              <Path
                d="M 95 108 v 14"
                stroke={accent}
                strokeWidth={2}
                strokeLinecap="round"
              />
              {/* small rounded tree */}
              <Circle cx={30} cy={140} r={9} fill={accent} />
              <Path
                d="M 30 149 v 10"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              {/* fern */}
              <Path
                d="M 130 110 Q 120 95 130 82"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Path
                d="M 126 100 q 6 -2 8 1 M 128 92 q 6 -2 8 1 M 132 106 q 6 2 8 -1"
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
                strokeLinecap="round"
              />
              {/* mushroom */}
              <Path d="M 70 40 a 8 8 0 0 1 16 0 Z" fill={accent} />
              <Rect x={75} y={40} width={6} height={8} rx={2} fill={accent} />
              {/* leaves */}
              <Path d="M 160 30 Q 168 24 174 32 Q 166 38 160 30 Z" fill={accent} />
              <Path d="M 20 90 Q 28 84 34 92 Q 26 98 20 90 Z" fill={accent} />
              <Path d="M 110 160 Q 118 154 124 162 Q 116 168 110 160 Z" fill={accent} />
              {/* dots */}
              <Circle cx={55} cy={110} r={1.8} fill={accent} />
              <Circle cx={155} cy={140} r={1.8} fill={accent} />
              <Circle cx={85} cy={35} r={1.8} fill={accent} />
            </>
          )}

          {preset.pattern === "sunset" && (
            // A low sun with rays above the horizon, soft clouds, flying
            // birds and gentle waves.
            <>
              {/* half sun on the horizon */}
              <Path d="M 60 130 A 24 24 0 0 1 108 130 Z" fill={accent} />
              {/* sun rays (upper half) */}
              {[0, 30, 60, 90, 120, 150, 180].map((deg) => {
                const a = (deg * Math.PI) / 180;
                return (
                  <Path
                    key={`ray-${deg}`}
                    d={`M ${84 + 32 * Math.cos(a)} ${130 - 32 * Math.sin(a)} l ${5 * Math.cos(a)} ${-5 * Math.sin(a)}`}
                    stroke={accent}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                );
              })}
              {/* clouds */}
              <Circle cx={30} cy={92} r={7} fill={accent} />
              <Circle cx={42} cy={88} r={9} fill={accent} />
              <Circle cx={55} cy={92} r={6} fill={accent} />
              <Rect x={24} y={92} width={37} height={8} rx={4} fill={accent} />
              <Circle cx={140} cy={60} r={6} fill={accent} />
              <Circle cx={150} cy={57} r={7} fill={accent} />
              <Circle cx={160} cy={60} r={5} fill={accent} />
              <Rect x={135} y={60} width={30} height={7} rx={3.5} fill={accent} />
              {/* birds */}
              <Path
                d="M 40 45 q 6 -7 12 0 q 6 -7 12 0"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              <Path
                d="M 110 75 q 5 -6 10 0 q 5 -6 10 0"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* waves below the sun */}
              <Path
                d="M 45 145 Q 52 140 59 145 Q 66 150 73 145 Q 80 140 87 145 Q 94 150 101 145"
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Path
                d="M 115 158 Q 122 153 129 158 Q 136 163 143 158"
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              {/* dots */}
              <Circle cx={20} cy={120} r={1.8} fill={accent} />
              <Circle cx={165} cy={100} r={1.6} fill={accent} />
              <Circle cx={150} cy={170} r={1.8} fill={accent} />
            </>
          )}

          {preset.pattern === "ocean" && (
            // Rolling waves, fish, a jellyfish, seaweed, bubbles and a tiny
            // sailboat in blues.
            <>
              {/* waves */}
              <Path
                d="M 8 40 Q 16 32 24 40 Q 32 48 40 40 Q 48 32 56 40 Q 64 48 72 40"
                fill="none"
                stroke={accent}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              <Path
                d="M 95 25 Q 103 17 111 25 Q 119 33 127 25 Q 135 17 143 25"
                fill="none"
                stroke={accent}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              <Path
                d="M 20 110 Q 28 102 36 110 Q 44 118 52 110 Q 60 102 68 110 Q 76 118 84 110"
                fill="none"
                stroke={accent}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              <Path
                d="M 110 130 Q 118 122 126 130 Q 134 138 142 130 Q 150 122 158 130"
                fill="none"
                stroke={accent}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              {/* fish swimming left */}
              <Path d="M 35 160 Q 45 152 56 160 Q 45 168 35 160 Z" fill={accent} />
              <Path d="M 56 160 l 7 -5 l 0 10 Z" fill={accent} />
              <Circle
                cx={42}
                cy={159}
                r={1.2}
                fill={isDark ? preset.darkColor : preset.lightColor}
              />
              {/* fish swimming right (small) */}
              <Path d="M 135 60 Q 143 54 152 60 Q 143 66 135 60 Z" fill={accent} />
              <Path d="M 135 60 l -6 -4 l 0 8 Z" fill={accent} />
              {/* jellyfish */}
              <Path d="M 165 112 a 7 7 0 0 1 14 0 Z" fill={accent} />
              <Path
                d="M 168 112 q -4 8 0 16 M 172 112 q 4 8 0 16 M 176 112 q -4 8 0 16"
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              {/* seaweed */}
              <Path
                d="M 85 170 q -6 -10 0 -20 q 6 -10 0 -20 q -6 -10 0 -20"
                fill="none"
                stroke={accent}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              <Path
                d="M 100 170 q 6 -8 0 -16 q -6 -8 0 -16"
                fill="none"
                stroke={accent}
                strokeWidth={1.6}
                strokeLinecap="round"
              />
              {/* bubbles */}
              <Circle
                cx={70}
                cy={75}
                r={4}
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
              />
              <Circle
                cx={120}
                cy={95}
                r={6}
                fill="none"
                stroke={accent}
                strokeWidth={1.4}
              />
              <Circle
                cx={60}
                cy={60}
                r={2.5}
                fill="none"
                stroke={accent}
                strokeWidth={1.2}
              />
              <Circle
                cx={150}
                cy={150}
                r={3.5}
                fill="none"
                stroke={accent}
                strokeWidth={1.3}
              />
              {/* sailboat */}
              <Path d="M 92 44 Q 104 51 116 44 L 110 49 L 98 49 Z" fill={accent} />
              <Path
                d="M 104 26 v 18"
                stroke={accent}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
              <Path d="M 104 28 L 104 42 L 113 42 Z" fill={accent} />
              {/* dots */}
              <Circle cx={30} cy={25} r={1.8} fill={accent} />
              <Circle cx={145} cy={105} r={1.6} fill={accent} />
              <Circle cx={55} cy={90} r={1.6} fill={accent} />
            </>
          )}
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={baseColor} />
      <Rect
        width="100%"
        height="100%"
        fill={`url(#${patternId})`}
        opacity={opacity}
      />
    </Svg>
    </View>
  );
}

/** Fixed-size swatch used in the background picker grid. */
export function ChatBackgroundPreview({
  preset,
  isDark,
  imageUri,
  size = 64,
  borderRadius = 14,
}: {
  preset: ChatBackgroundPreset;
  isDark: boolean;
  imageUri?: string | null;
  size?: number;
  borderRadius?: number;
}) {
  return (
    <ChatBackground
      preset={preset}
      isDark={isDark}
      imageUri={imageUri}
      style={{ width: size, height: size, borderRadius, overflow: "hidden" }}
    />
  );
}
