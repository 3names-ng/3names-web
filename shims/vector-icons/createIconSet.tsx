// Web replacement for @expo/vector-icons' createIconSet: renders the glyph
// from the same icon font the native app uses, registered via @font-face.
"use client";

import React from "react";
import { Text, type TextProps, type StyleProp, type TextStyle } from "react-native";

type FontSource = string | { src?: string; default?: string };

const injected = new Set<string>();

function fontUrl(src: FontSource): string {
  if (typeof src === "string") return src;
  return src?.src ?? src?.default ?? "";
}

function ensureFontFace(family: string, src: FontSource) {
  if (injected.has(family) || typeof document === "undefined") return;
  injected.add(family);
  const style = document.createElement("style");
  style.textContent = `@font-face{font-family:"${family}";src:url("${fontUrl(src)}") format("truetype");font-display:block;}`;
  document.head.appendChild(style);
}

export type IconProps<G extends string> = TextProps & {
  name: G;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  // FontAwesome 5/6 variants
  solid?: boolean;
  brand?: boolean;
  regular?: boolean;
  light?: boolean;
};

export type IconComponent<M extends Record<string, number>> = React.FC<IconProps<keyof M & string>> & {
  glyphMap: M;
  getRawGlyphMap: () => M;
  getFontFamily: () => string;
  loadFont: () => Promise<void>;
  font: Record<string, FontSource>;
};

export default function createIconSet<M extends Record<string, number>>(
  glyphMap: M,
  fontFamily: string,
  fontSource: FontSource,
  pickFont?: (props: IconProps<keyof M & string>) => { family: string; source: FontSource }
): IconComponent<M> {
  const Icon = (props: IconProps<keyof M & string>) => {
    const { name, size = 12, color, style, solid, brand, regular, light, ...rest } = props;
    const { family, source } = pickFont ? pickFont(props) : { family: fontFamily, source: fontSource };
    ensureFontFace(family, source);
    const code = glyphMap[name];
    const glyph = typeof code === "number" ? String.fromCodePoint(code) : "?";
    return (
      <Text
        selectable={false}
        {...rest}
        style={[
          { fontSize: size, color: color ?? "black", fontFamily: family, fontWeight: "normal", fontStyle: "normal", lineHeight: size },
          style,
          { fontFamily: family },
        ]}
      >
        {glyph}
      </Text>
    );
  };
  const comp = Icon as IconComponent<M>;
  comp.glyphMap = glyphMap;
  comp.getRawGlyphMap = () => glyphMap;
  comp.getFontFamily = () => fontFamily;
  comp.loadFont = async () => ensureFontFace(fontFamily, fontSource);
  comp.font = { [fontFamily]: fontSource };
  return comp;
}
