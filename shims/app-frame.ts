// The screens were designed for phones and size things from the window width
// (e.g. `Dimensions.get("window").width * 0.5`). On desktop the app renders in
// a centered column (see #root in global.css), so Dimensions and
// useWindowDimensions report that column's width instead of the browser's.
// Imported for its side effect by shims/next-root-shell.tsx, before any screen
// module evaluates.
import { Dimensions } from "react-native";

/** Keep in sync with #root max-width in global.css. */
export const MAX_APP_WIDTH = 480;

type DimName = "window" | "screen";
type Dims = { width: number; height: number; scale: number; fontScale: number };

const clamp = (d: Dims): Dims => (d.width > MAX_APP_WIDTH ? { ...d, width: MAX_APP_WIDTH } : d);

const D = Dimensions as unknown as {
  get(dim: DimName): Dims;
  addEventListener(type: "change", handler: (e: { window: Dims; screen: Dims }) => void): { remove(): void };
  __framed?: boolean;
};

if (!D.__framed) {
  D.__framed = true;
  const get = D.get.bind(D);
  D.get = (dim) => clamp(get(dim));
  const add = D.addEventListener.bind(D);
  D.addEventListener = (type, handler) =>
    add(type, (e) => handler({ window: clamp(e.window), screen: clamp(e.screen) }));
}
