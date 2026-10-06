import React from "react";

/** Structural themes compatible with react-navigation's Theme type. */
const baseColors = {
  primary: "#6C3EF4",
  background: "#ffffff",
  card: "#ffffff",
  text: "#111111",
  border: "#e5e5e5",
  notification: "#ff3b30",
};

export const DefaultTheme = {
  dark: false,
  colors: { ...baseColors },
};

export const DarkTheme = {
  dark: true,
  colors: {
    ...baseColors,
    background: "#050608",
    card: "#171717",
    text: "#ffffff",
    border: "#262626",
  },
};

export function ThemeProvider({
  value: _value,
  children,
}: {
  value?: any;
  children?: React.ReactNode;
}) {
  return <>{children}</>;
}

export const NavigationContainer = ThemeProvider;

export default ThemeProvider;
