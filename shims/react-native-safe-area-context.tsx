import React from "react";
import { View } from "react-native";

export const initialWindowMetrics = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
};

export type EdgeInsets = { top: number; left: number; right: number; bottom: number };
export type Metrics = typeof initialWindowMetrics;

export function SafeAreaProvider({
  children,
  initialMetrics: _initialMetrics,
}: {
  children?: React.ReactNode;
  initialMetrics?: Metrics | null;
}) {
  return <>{children}</>;
}

export function SafeAreaView({ children, style, ...rest }: any) {
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
}

export function useSafeAreaInsets(): EdgeInsets {
  return { top: 0, left: 0, right: 0, bottom: 0 };
}

export function useSafeAreaFrame() {
  if (typeof window !== "undefined") {
    return { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}

export function useInitialWindowMetrics(): Metrics | null {
  return initialWindowMetrics;
}

export function useCollapsibleHeaders() {
  return { collapsibleHeaderHeight: 0, headerHeight: 0, topInset: 0 };
}

const SafeAreaInsetsContext = React.createContext<EdgeInsets>(initialWindowMetrics.insets);

export { SafeAreaInsetsContext };
export const SafeAreaFrameContext = React.createContext(useSafeAreaFrameSafe());

function useSafeAreaFrameSafe() {
  return { x: 0, y: 0, width: 0, height: 0 };
}
