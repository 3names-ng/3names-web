import type { TextStyle } from "react-native";

// Shared text-post typography contract between the composer (what the user
// picks) and the feed card (how the post renders). Keys are persisted on the
// backend `posts` row (fontStyle / fontSize), so both surfaces must agree on
// the exact key set.
export type TextPostFontStyle = "classic" | "serif" | "typewriter" | "light" | "strong";
export type TextPostFontSize = "small" | "medium" | "large";

export interface TextFontPreset {
  key: TextPostFontStyle;
  label: string;
  /** Cross-platform style: only generic families (serif/monospace) + weight. */
  style: Pick<TextStyle, "fontFamily" | "fontWeight" | "fontStyle" | "letterSpacing">;
}

export const TEXT_FONT_PRESETS: TextFontPreset[] = [
  { key: "classic", label: "Classic", style: { fontWeight: "700" } },
  { key: "serif", label: "Serif", style: { fontFamily: "serif", fontWeight: "600" } },
  {
    key: "typewriter",
    label: "Typewriter",
    style: { fontFamily: "monospace", fontWeight: "500" },
  },
  { key: "light", label: "Light", style: { fontWeight: "300", letterSpacing: 0.4 } },
  { key: "strong", label: "Strong", style: { fontWeight: "900" } },
];

export const TEXT_POST_FONT_SIZES: Record<TextPostFontSize, number> = {
  small: 26,
  medium: 36,
  large: 48,
};

/**
 * One "card" of a text post. A post can carry several of these (composed as
 * a swipeable carousel, same idea as multiple media items on a media post) —
 * see TextPostSlide[] on CreatePostPayload.textSlides and post.textSlides.
 */
export interface TextPostSlide {
  id: string;
  text: string;
  backgroundColor: string;
  textAlign: "left" | "center" | "right";
  fontStyle: TextPostFontStyle;
  fontSize: TextPostFontSize;
}

export const FONT_PRESET_BY_KEY = Object.fromEntries(
  TEXT_FONT_PRESETS.map((preset) => [preset.key, preset]),
) as Record<TextPostFontStyle, TextFontPreset>;

/** Resolve a persisted fontStyle key to a text style (fallback: classic). */
export function resolveTextPostFontStyle(
  key?: string | null,
): Pick<TextStyle, "fontFamily" | "fontWeight" | "fontStyle" | "letterSpacing"> {
  return FONT_PRESET_BY_KEY[key as TextPostFontStyle]?.style ?? FONT_PRESET_BY_KEY.classic.style;
}

/** Resolve a persisted fontSize key to a number (fallback: medium). */
export function resolveTextPostFontSize(key?: string | null): number {
  return TEXT_POST_FONT_SIZES[key as TextPostFontSize] ?? TEXT_POST_FONT_SIZES.medium;
}
