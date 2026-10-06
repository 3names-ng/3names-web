import { DarkTheme, LightTheme } from "@/constants/color";

import { useColorScheme } from "nativewind";

/**
 * Single source of truth for theming.
 *
 * Reads the NativeWind color scheme, which defaults to the system appearance
 * and is flipped by the in-app "Appearance" toggle (setColorScheme). This keeps
 * `colors` (used by every screen via useTheme) in sync with the `dark:` utility
 * classes and the react-navigation theme.
 */
export function useTheme() {
  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";

  return {
    isDark,
    colors: isDark ? DarkTheme : LightTheme,
    mode: colorScheme ?? "system",
  };
}