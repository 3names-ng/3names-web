// @sentry/react-native is native-only. On web errors are logged to the
// console; swap this for @sentry/nextjs if web crash reporting is needed.
import type { ComponentType } from "react";

export function init(_opts: Record<string, unknown>) {}

export function setUser(_user: { id: string } | null) {}

export function captureException(error: unknown) {
  console.error("[Sentry]", error);
  return "";
}

export function captureMessage(message: string) {
  console.warn("[Sentry]", message);
  return "";
}

export function wrap<P>(component: ComponentType<P>): ComponentType<P> {
  return component;
}
