/**
 * Profile frame definitions.
 * Each frame is a set of gradient colors that render as a ring around the avatar.
 * Only users at Level 6+ can select a frame.
 */

export interface ProfileFrame {
  id: string;
  name: string;
  /** Two or three colors for the gradient ring */
  colors: string[];
  /** Optional secondary accent color for inner glow */
  glow?: string;
  /** Emoji shown in the picker */
  emoji: string;
}

export const PROFILE_FRAMES: ProfileFrame[] = [
  {
    id: "none",
    name: "None",
    colors: ["transparent", "transparent"],
    emoji: "🚫",
  },
  {
    id: "gold-ring",
    name: "Gold Ring",
    colors: ["#FFD700", "#FFA500", "#FF8C00"],
    glow: "#FFD70040",
    emoji: "🥇",
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    colors: ["#F4C2C2", "#E8A0BF", "#BA68C8"],
    glow: "#F4C2C240",
    emoji: "🌸",
  },
  {
    id: "neon-blue",
    name: "Neon Blue",
    colors: ["#00D4FF", "#0099FF", "#0055FF"],
    glow: "#00D4FF40",
    emoji: "💎",
  },
  {
    id: "fire-gradient",
    name: "Fire Gradient",
    colors: ["#FF4500", "#FF6347", "#FF8C00"],
    glow: "#FF450040",
    emoji: "🔥",
  },
  {
    id: "emerald",
    name: "Emerald",
    colors: ["#50C878", "#2E8B57", "#006400"],
    glow: "#50C87840",
    emoji: "💚",
  },
  {
    id: "purple-haze",
    name: "Purple Haze",
    colors: ["#9B59B6", "#8E44AD", "#6C3483"],
    glow: "#9B59B640",
    emoji: "🔮",
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: ["#FF6B6B", "#FFA07A", "#FFD93D"],
    glow: "#FF6B6B40",
    emoji: "🌅",
  },
  {
    id: "arctic",
    name: "Arctic",
    colors: ["#E0F7FA", "#80DEEA", "#00BCD4"],
    glow: "#80DEEA40",
    emoji: "❄️",
  },
  {
    id: "champion",
    name: "Champion",
    colors: ["#FFD700", "#FF1744", "#D500F9"],
    glow: "#FFD70040",
    emoji: "🏆",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    colors: ["#1A237E", "#4A148C", "#880E4F"],
    glow: "#4A148C40",
    emoji: "🌌",
  },
  {
    id: "diamond",
    name: "Diamond",
    colors: ["#B9F2FF", "#E0F7FA", "#FFFFFF", "#B9F2FF"],
    glow: "#B9F2FF40",
    emoji: "💠",
  },
];

/**
 * Get a frame by its ID. Returns undefined if not found.
 */
export function getFrameById(id: string | null | undefined): ProfileFrame | undefined {
  if (!id) return undefined;
  return PROFILE_FRAMES.find((f) => f.id === id);
}
