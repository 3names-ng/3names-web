import type { ReactNode } from "react";

export type StatusBarStyle = "auto" | "inverted" | "light" | "dark";

export interface StatusBarProps {
  style?: StatusBarStyle;
  hidden?: boolean;
  animated?: boolean;
  translucent?: boolean;
  backgroundColor?: string;
  networkActivityIndicatorVisible?: boolean;
  children?: ReactNode;
}

/** No-op on web — the browser chrome provides its own status bar. */
export function StatusBar(_props: StatusBarProps) {
  return null;
}

export default StatusBar;
