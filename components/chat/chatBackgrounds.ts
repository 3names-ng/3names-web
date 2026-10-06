// Chat wallpaper presets. A background is either a solid color, a tiled
// SVG pattern, or a user-picked photo. Every preset carries a light and a
// dark variant so the chat stays readable in both themes.

export type ChatBackgroundPattern =
  | "doodle"
  | "dots"
  | "stripes"
  | "waves"
  | "zigzag"
  | "grid"
  | "chevron"
  | "hearts"
  | "stars"
  | "bloom"
  | "scribble"
  | "bubbles"
  | "confetti"
  | "starry"
  | "beach"
  | "night"
  | "forest"
  | "sunset"
  | "ocean";

export interface ChatBackgroundPreset {
  key: string;
  label: string;
  kind: "color" | "pattern" | "image";
  /** Base background color in light theme */
  lightColor: string;
  /** Base background color in dark theme */
  darkColor: string;
  /** Pattern drawn on top of the base color (pattern presets only) */
  pattern?: ChatBackgroundPattern;
  /** Accent color used by the pattern in light theme */
  lightPatternColor?: string;
  /** Accent color used by the pattern in dark theme */
  darkPatternColor?: string;
  /** Opacity of the pattern overlay in light theme (default 0.1) */
  lightPatternOpacity?: number;
  /** Opacity of the pattern overlay in dark theme (default 0.08) */
  darkPatternOpacity?: number;
  /** Repeating tile size in px (default 90). Denser hand-drawn patterns
   * use a larger tile so the motifs don't get cramped. */
  patternTileSize?: number;
}

export const CHAT_BACKGROUNDS: ChatBackgroundPreset[] = [
  // --- User photo (kind: "image" — actual URI lives in the store) ---
  {
    key: "image",
    label: "Photo",
    kind: "image",
    lightColor: "#E4DDD3",
    darkColor: "#0B141A",
  },
  // --- Patterns ---
  {
    key: "doodle",
    label: "Doodle",
    kind: "pattern",
    pattern: "doodle",
    // The authentic WhatsApp default wallpaper: warm beige in light mode,
    // deep charcoal in dark mode, with hand-drawn squiggly motifs on top.
    lightColor: "#ECE5DD",
    darkColor: "#0B141A",
    lightPatternColor: "#3F3F3F",
    darkPatternColor: "#FFFFFF",
    lightPatternOpacity: 0.14,
    darkPatternOpacity: 0.14,
    patternTileSize: 180,
  },
  {
    key: "dots",
    label: "Dots",
    kind: "pattern",
    pattern: "dots",
    lightColor: "#E8EEF5",
    darkColor: "#101D2B",
    lightPatternColor: "#3B82F6",
    darkPatternColor: "#60A5FA",
  },
  {
    key: "stripes",
    label: "Stripes",
    kind: "pattern",
    pattern: "stripes",
    lightColor: "#F0E8F5",
    darkColor: "#1E1229",
    lightPatternColor: "#A855F7",
    darkPatternColor: "#C084FC",
  },
  {
    key: "waves",
    label: "Waves",
    kind: "pattern",
    pattern: "waves",
    lightColor: "#E3F0EC",
    darkColor: "#0E1F1A",
    lightPatternColor: "#14B8A6",
    darkPatternColor: "#5EEAD4",
  },
  {
    key: "zigzag",
    label: "Zigzag",
    kind: "pattern",
    pattern: "zigzag",
    lightColor: "#FDF1E4",
    darkColor: "#241507",
    lightPatternColor: "#F97316",
    darkPatternColor: "#FDBA74",
  },
  {
    key: "grid",
    label: "Grid",
    kind: "pattern",
    pattern: "grid",
    lightColor: "#EEF0F4",
    darkColor: "#17181C",
    lightPatternColor: "#64748B",
    darkPatternColor: "#94A3B8",
  },
  {
    key: "chevron",
    label: "Chevron",
    kind: "pattern",
    pattern: "chevron",
    lightColor: "#FDF0F3",
    darkColor: "#241014",
    lightPatternColor: "#EC4899",
    darkPatternColor: "#F9A8D4",
  },
  {
    key: "hearts",
    label: "Hearts",
    kind: "pattern",
    pattern: "hearts",
    lightColor: "#FBEFF2",
    darkColor: "#261117",
    lightPatternColor: "#F43F5E",
    darkPatternColor: "#FDA4AF",
  },
  {
    key: "stars",
    label: "Stars",
    kind: "pattern",
    pattern: "stars",
    lightColor: "#F2EFFB",
    darkColor: "#171226",
    lightPatternColor: "#8B5CF6",
    darkPatternColor: "#C4B5FD",
  },
  {
    key: "bloom",
    label: "Bloom",
    kind: "pattern",
    pattern: "bloom",
    lightColor: "#F6EFE6",
    darkColor: "#181008",
    lightPatternColor: "#7A8B6F",
    darkPatternColor: "#A8C3A0",
    lightPatternOpacity: 0.15,
    darkPatternOpacity: 0.15,
    patternTileSize: 180,
  },
  {
    key: "scribble",
    label: "Scribble",
    kind: "pattern",
    pattern: "scribble",
    lightColor: "#F1EDE6",
    darkColor: "#14120F",
    lightPatternColor: "#4A4A4A",
    darkPatternColor: "#E8E8E8",
    lightPatternOpacity: 0.12,
    darkPatternOpacity: 0.12,
    patternTileSize: 180,
  },
  {
    key: "bubbles",
    label: "Bubbles",
    kind: "pattern",
    pattern: "bubbles",
    lightColor: "#E8EFF4",
    darkColor: "#0C1922",
    lightPatternColor: "#6E9FBF",
    darkPatternColor: "#A8CDE6",
    lightPatternOpacity: 0.13,
    darkPatternOpacity: 0.13,
    patternTileSize: 180,
  },
  {
    key: "confetti",
    label: "Confetti",
    kind: "pattern",
    pattern: "confetti",
    lightColor: "#FAF0EE",
    darkColor: "#200F10",
    lightPatternColor: "#D96C73",
    darkPatternColor: "#F2A0A5",
    lightPatternOpacity: 0.15,
    darkPatternOpacity: 0.15,
    patternTileSize: 180,
  },
  {
    key: "starry",
    label: "Starry Night",
    kind: "pattern",
    pattern: "starry",
    // A field of sparkle stars, tiny dots and a shooting star under a
    // crescent moon — gold on deep navy in dark mode, navy on pale blue
    // in light mode.
    lightColor: "#DCE6F5",
    darkColor: "#0A1226",
    lightPatternColor: "#4A6FA5",
    darkPatternColor: "#F5D67B",
    lightPatternOpacity: 0.4,
    darkPatternOpacity: 0.45,
    patternTileSize: 180,
  },
  {
    key: "beach",
    label: "Beach",
    kind: "pattern",
    pattern: "beach",
    // Warm sand with a sun, a leaning palm, rolling waves, a starfish and
    // a scallop shell.
    lightColor: "#F6EDDE",
    darkColor: "#1B1209",
    lightPatternColor: "#D97747",
    darkPatternColor: "#F2A880",
    lightPatternOpacity: 0.2,
    darkPatternOpacity: 0.22,
    patternTileSize: 180,
  },
  {
    key: "night",
    label: "Night",
    kind: "pattern",
    pattern: "night",
    // A moody night scene: big crescent moon, soft clouds, mountain
    // silhouettes and a few stars.
    lightColor: "#E3E9F2",
    darkColor: "#0B0E1A",
    lightPatternColor: "#5B6C8C",
    darkPatternColor: "#E8E4D0",
    lightPatternOpacity: 0.25,
    darkPatternOpacity: 0.3,
    patternTileSize: 180,
  },
  {
    key: "forest",
    label: "Forest",
    kind: "pattern",
    pattern: "forest",
    // Tall pines, rounded trees, ferns, a mushroom and scattered leaves in
    // soft greens.
    lightColor: "#E8F0E4",
    darkColor: "#0F1A10",
    lightPatternColor: "#4E7A4E",
    darkPatternColor: "#9CC99B",
    lightPatternOpacity: 0.18,
    darkPatternOpacity: 0.2,
    patternTileSize: 180,
  },
  {
    key: "sunset",
    label: "Sunset",
    kind: "pattern",
    pattern: "sunset",
    // A low sun on the horizon with rays, soft clouds, birds and gentle
    // waves in warm sunset tones.
    lightColor: "#FBEBDD",
    darkColor: "#24121C",
    lightPatternColor: "#E8734A",
    darkPatternColor: "#F5A072",
    lightPatternOpacity: 0.22,
    darkPatternOpacity: 0.25,
    patternTileSize: 180,
  },
  {
    key: "ocean",
    label: "Ocean",
    kind: "pattern",
    pattern: "ocean",
    // Rolling waves, fish, a jellyfish, seaweed, bubbles and a tiny
    // sailboat in blues.
    lightColor: "#E3EEF5",
    darkColor: "#0A1A24",
    lightPatternColor: "#2E7E9E",
    darkPatternColor: "#7FC4DD",
    lightPatternOpacity: 0.18,
    darkPatternOpacity: 0.22,
    patternTileSize: 180,
  },
  // --- Solid colors ---
  {
    key: "solid-white",
    label: "White",
    kind: "color",
    lightColor: "#FFFFFF",
    darkColor: "#1C1C1E",
  },
  {
    key: "solid-beige",
    label: "Beige",
    kind: "color",
    lightColor: "#F3EDE3",
    darkColor: "#1F1B16",
  },
  {
    key: "solid-mint",
    label: "Mint",
    kind: "color",
    lightColor: "#E3F0E6",
    darkColor: "#12201A",
  },
  {
    key: "solid-sky",
    label: "Sky",
    kind: "color",
    lightColor: "#E1EDF7",
    darkColor: "#101C28",
  },
  {
    key: "solid-rose",
    label: "Rose",
    kind: "color",
    lightColor: "#F8E8EC",
    darkColor: "#291317",
  },
  {
    key: "solid-lavender",
    label: "Lavender",
    kind: "color",
    lightColor: "#EEEAF7",
    darkColor: "#1C1428",
  },
  {
    key: "solid-amber",
    label: "Amber",
    kind: "color",
    lightColor: "#FAF0DC",
    darkColor: "#241A0C",
  },
  {
    key: "solid-charcoal",
    label: "Charcoal",
    kind: "color",
    lightColor: "#2A2A2E",
    darkColor: "#0E0E10",
  },
];

export const DEFAULT_CHAT_BACKGROUND_KEY = "doodle";

/** Resolve a stored preset key to its config; unknown keys fall back to the default. */
export function getChatBackgroundPreset(
  key?: string | null,
): ChatBackgroundPreset {
  return (
    CHAT_BACKGROUNDS.find((bg) => bg.key === key) ||
    CHAT_BACKGROUNDS.find((bg) => bg.key === DEFAULT_CHAT_BACKGROUND_KEY) ||
    CHAT_BACKGROUNDS[1]
  );
}
