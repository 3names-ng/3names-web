// Web stand-in for react-native-gesture-handler. Gesture builders record
// their callbacks, and <GestureDetector> drives them from pointer events:
// Pan, Fling and Tap from a single pointer, Pinch from two pointers (or
// ctrl+wheel, which is how trackpads report pinch). Callbacks run on the JS
// thread, so "worklet" directives and runOnJS are harmless.
"use client";

import React, { useEffect, useRef } from "react";
import {
  FlatList as RNFlatList,
  ScrollView as RNScrollView,
  TouchableOpacity as RNTouchableOpacity,
  TouchableWithoutFeedback as RNTouchableWithoutFeedback,
  View,
} from "react-native";

export const Directions = { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 } as const;
export const State = { UNDETERMINED: 0, FAILED: 1, BEGAN: 2, CANCELLED: 3, ACTIVE: 4, END: 5 } as const;

export type GestureEvent = {
  x: number;
  y: number;
  absoluteX: number;
  absoluteY: number;
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
  changeX: number;
  changeY: number;
  scale: number;
  scaleChange: number;
  focalX: number;
  focalY: number;
  numberOfPointers: number;
  state: number;
};

type Handler = (e: GestureEvent, success?: boolean) => void;
type Kind = "pan" | "fling" | "tap" | "pinch" | "longPress" | "other";

class GestureBuilder {
  handlers: Partial<Record<"onBegin" | "onStart" | "onUpdate" | "onChange" | "onEnd" | "onFinalize", Handler>> = {};
  config: {
    enabled: boolean;
    minDistance: number;
    activeOffsetX?: [number, number];
    activeOffsetY?: [number, number];
    direction: number;
    minDuration: number;
    maxDist: number;
  } = { enabled: true, minDistance: 0, direction: 0, minDuration: 500, maxDist: 10 };

  constructor(public kind: Kind) {}

  private set(name: keyof GestureBuilder["handlers"], fn: Handler) {
    this.handlers[name] = fn;
    return this;
  }
  onBegin(fn: Handler) { return this.set("onBegin", fn); }
  onStart(fn: Handler) { return this.set("onStart", fn); }
  onUpdate(fn: Handler) { return this.set("onUpdate", fn); }
  onChange(fn: Handler) { return this.set("onChange", fn); }
  onEnd(fn: Handler) { return this.set("onEnd", fn); }
  onFinalize(fn: Handler) { return this.set("onFinalize", fn); }
  onTouchesDown(_fn: unknown) { return this; }
  onTouchesMove(_fn: unknown) { return this; }
  onTouchesUp(_fn: unknown) { return this; }

  enabled(v = true) { this.config.enabled = v; return this; }
  minDistance(d: number) { this.config.minDistance = d; return this; }
  activeOffsetX(v: number | [number, number]) {
    this.config.activeOffsetX = Array.isArray(v) ? v : v < 0 ? [v, Infinity] : [-Infinity, v];
    return this;
  }
  activeOffsetY(v: number | [number, number]) {
    this.config.activeOffsetY = Array.isArray(v) ? v : v < 0 ? [v, Infinity] : [-Infinity, v];
    return this;
  }
  direction(d: number) { this.config.direction = d; return this; }
  minDuration(ms: number) { this.config.minDuration = ms; return this; }
  maxDistance(d: number) { this.config.maxDist = d; return this; }

  // Accepted for API compatibility; no effect on web.
  runOnJS(_v = true) { return this; }
  failOffsetX(_v: unknown) { return this; }
  failOffsetY(_v: unknown) { return this; }
  numberOfTaps(_n: number) { return this; }
  numberOfPointers(_n: number) { return this; }
  minPointers(_n: number) { return this; }
  maxPointers(_n: number) { return this; }
  shouldCancelWhenOutside(_v: boolean) { return this; }
  hitSlop(_v: unknown) { return this; }
  simultaneousWithExternalGesture(..._g: unknown[]) { return this; }
  requireExternalGestureToFail(..._g: unknown[]) { return this; }
  blocksExternalGesture(..._g: unknown[]) { return this; }
  withRef(_r: unknown) { return this; }
  withTestId(_id: string) { return this; }
  cancelsTouchesInView(_v: boolean) { return this; }
  activateAfterLongPress(_ms: number) { return this; }
  averageTouches(_v: boolean) { return this; }
  enableTrackpadTwoFingerGesture(_v: boolean) { return this; }
  maxDuration(_ms: number) { return this; }
  maxDelay(_ms: number) { return this; }
  manualActivation(_v: boolean) { return this; }
}

class ComposedGesture {
  constructor(public gestures: AnyGesture[]) {}
}
type AnyGesture = GestureBuilder | ComposedGesture;

const flatten = (g: AnyGesture): GestureBuilder[] =>
  g instanceof ComposedGesture ? g.gestures.flatMap(flatten) : [g];

export const Gesture = {
  Pan: () => new GestureBuilder("pan"),
  Fling: () => new GestureBuilder("fling"),
  Tap: () => new GestureBuilder("tap"),
  Pinch: () => new GestureBuilder("pinch"),
  LongPress: () => new GestureBuilder("longPress"),
  Rotation: () => new GestureBuilder("other"),
  ForceTouch: () => new GestureBuilder("other"),
  Hover: () => new GestureBuilder("other"),
  Native: () => new GestureBuilder("other"),
  Manual: () => new GestureBuilder("other"),
  Simultaneous: (...g: AnyGesture[]) => new ComposedGesture(g),
  Race: (...g: AnyGesture[]) => new ComposedGesture(g),
  Exclusive: (...g: AnyGesture[]) => new ComposedGesture(g),
};

/* ------------------------------------------------------------------ */
/* Pointer tracking                                                    */
/* ------------------------------------------------------------------ */

type Track = {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  t: number;
  vx: number;
  vy: number;
};

function baseEvent(partial: Partial<GestureEvent>): GestureEvent {
  return {
    x: 0, y: 0, absoluteX: 0, absoluteY: 0,
    translationX: 0, translationY: 0, velocityX: 0, velocityY: 0,
    changeX: 0, changeY: 0, scale: 1, scaleChange: 1, focalX: 0, focalY: 0,
    numberOfPointers: 1, state: State.ACTIVE,
    ...partial,
  };
}

function shouldActivatePan(g: GestureBuilder, dx: number, dy: number) {
  const { activeOffsetX: ox, activeOffsetY: oy, minDistance } = g.config;
  if (ox || oy) {
    return (!!ox && (dx <= ox[0] || dx >= ox[1])) || (!!oy && (dy <= oy[0] || dy >= oy[1]));
  }
  return Math.hypot(dx, dy) >= Math.max(minDistance, 1);
}

function flingMatches(direction: number, dx: number, dy: number) {
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  if (!direction) return Math.hypot(dx, dy) > 30;
  if (horizontal) {
    if (dx > 30 && direction & Directions.RIGHT) return true;
    if (dx < -30 && direction & Directions.LEFT) return true;
  } else {
    if (dy > 30 && direction & Directions.DOWN) return true;
    if (dy < -30 && direction & Directions.UP) return true;
  }
  return false;
}

export function GestureDetector({ gesture, children }: { gesture: AnyGesture; children: React.ReactNode }) {
  const gestures = flatten(gesture).filter((g) => g.config.enabled);
  const latest = useRef(gestures);
  latest.current = gestures;
  const host = useRef<HTMLDivElement | null>(null);

  const needsTouchLock = gestures.some((g) => g.kind === "pan" || g.kind === "pinch" || g.kind === "fling");

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const pointers = new Map<number, Track>();
    const active = new Set<GestureBuilder>();
    let pinchStart = 0;
    let lastScale = 1;
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;

    const call = (g: GestureBuilder, name: keyof GestureBuilder["handlers"], e: GestureEvent, ok?: boolean) =>
      g.handlers[name]?.(e, ok);

    const rel = (x: number, y: number) => {
      const r = (el.firstElementChild ?? el).getBoundingClientRect();
      return { x: x - r.left, y: y - r.top };
    };

    const panEvent = (p: Track, extra?: Partial<GestureEvent>) =>
      baseEvent({
        ...rel(p.x, p.y),
        absoluteX: p.x,
        absoluteY: p.y,
        translationX: p.x - p.startX,
        translationY: p.y - p.startY,
        velocityX: p.vx,
        velocityY: p.vy,
        numberOfPointers: pointers.size,
        ...extra,
      });

    const pinchDistance = () => {
      const [a, b] = [...pointers.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };

    const onDown = (ev: PointerEvent) => {
      if (ev.pointerType === "mouse" && ev.button !== 0) return;
      pointers.set(ev.pointerId, {
        id: ev.pointerId, startX: ev.clientX, startY: ev.clientY,
        x: ev.clientX, y: ev.clientY, t: performance.now(), vx: 0, vy: 0,
      });
      const p = pointers.get(ev.pointerId)!;
      if (pointers.size === 1) {
        latest.current.forEach((g) => {
          if (g.kind === "pan" || g.kind === "tap") call(g, "onBegin", panEvent(p, { state: State.BEGAN }));
        });
        const lp = latest.current.filter((g) => g.kind === "longPress");
        if (lp.length) {
          longPressTimer = setTimeout(() => {
            const cur = pointers.get(ev.pointerId);
            if (!cur || Math.hypot(cur.x - cur.startX, cur.y - cur.startY) > 10) return;
            lp.forEach((g) => {
              active.add(g);
              call(g, "onStart", panEvent(cur));
            });
          }, Math.min(...lp.map((g) => g.config.minDuration)));
        }
      }
      if (pointers.size === 2) {
        pinchStart = pinchDistance();
        lastScale = 1;
        latest.current.forEach((g) => {
          if (g.kind !== "pinch") return;
          active.add(g);
          call(g, "onBegin", baseEvent({ numberOfPointers: 2, state: State.BEGAN }));
          call(g, "onStart", baseEvent({ numberOfPointers: 2 }));
        });
      }
    };

    const onMove = (ev: PointerEvent) => {
      const p = pointers.get(ev.pointerId);
      if (!p) return;
      const now = performance.now();
      const dt = Math.max(1, now - p.t);
      const dx = ev.clientX - p.x;
      const dy = ev.clientY - p.y;
      p.vx = (dx / dt) * 1000;
      p.vy = (dy / dt) * 1000;
      p.x = ev.clientX;
      p.y = ev.clientY;
      p.t = now;

      if (pointers.size >= 2) {
        const dist = pinchDistance();
        if (!pinchStart) return;
        const scale = dist / pinchStart;
        const [a, b] = [...pointers.values()];
        const focal = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
        latest.current.forEach((g) => {
          if (g.kind !== "pinch" || !active.has(g)) return;
          const e = baseEvent({ scale, scaleChange: scale / lastScale, focalX: focal.x, focalY: focal.y, numberOfPointers: 2 });
          call(g, "onUpdate", e);
          call(g, "onChange", e);
        });
        lastScale = scale;
        return;
      }

      const tx = p.x - p.startX;
      const ty = p.y - p.startY;
      latest.current.forEach((g) => {
        if (g.kind !== "pan") return;
        if (!active.has(g)) {
          if (!shouldActivatePan(g, tx, ty)) return;
          active.add(g);
          call(g, "onStart", panEvent(p));
        }
        const e = panEvent(p, { changeX: dx, changeY: dy });
        call(g, "onUpdate", e);
        call(g, "onChange", e);
      });
    };

    const onUp = (ev: PointerEvent, cancelled = false) => {
      const p = pointers.get(ev.pointerId);
      if (!p) return;
      if (longPressTimer) clearTimeout(longPressTimer);
      longPressTimer = null;
      const tx = p.x - p.startX;
      const ty = p.y - p.startY;
      const wasPinching = pointers.size >= 2;
      pointers.delete(ev.pointerId);

      latest.current.forEach((g) => {
        const e = panEvent(p, { state: cancelled ? State.CANCELLED : State.END });
        switch (g.kind) {
          case "pinch":
            if (wasPinching && active.has(g)) {
              const end = baseEvent({ scale: lastScale, numberOfPointers: 1, state: State.END });
              call(g, "onEnd", end, !cancelled);
              call(g, "onFinalize", end, !cancelled);
              active.delete(g);
            }
            break;
          case "pan":
            if (pointers.size) break;
            if (active.has(g)) call(g, "onEnd", e, !cancelled);
            call(g, "onFinalize", e, active.has(g) && !cancelled);
            active.delete(g);
            break;
          case "fling":
            if (!cancelled && !pointers.size && flingMatches(g.config.direction, tx, ty)) {
              call(g, "onStart", e);
              call(g, "onEnd", e, true);
            }
            break;
          case "tap": {
            const ok = !cancelled && Math.hypot(tx, ty) <= g.config.maxDist;
            if (ok) call(g, "onEnd", e, true);
            call(g, "onFinalize", e, ok);
            break;
          }
          case "longPress":
            if (active.has(g)) {
              call(g, "onEnd", e, !cancelled);
              call(g, "onFinalize", e, !cancelled);
              active.delete(g);
            }
            break;
        }
      });
      if (pointers.size < 2) pinchStart = 0;
    };

    // Trackpad pinch arrives as ctrl+wheel.
    let wheelScale = 1;
    let wheelEnd: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (ev: WheelEvent) => {
      const pinches = latest.current.filter((g) => g.kind === "pinch");
      if (!ev.ctrlKey || !pinches.length) return;
      ev.preventDefault();
      const focal = rel(ev.clientX, ev.clientY);
      if (!wheelEnd) pinches.forEach((g) => call(g, "onStart", baseEvent({ numberOfPointers: 2 })));
      const prev = wheelScale;
      wheelScale *= Math.exp(-ev.deltaY / 100);
      const e = baseEvent({ scale: wheelScale, scaleChange: wheelScale / prev, focalX: focal.x, focalY: focal.y, numberOfPointers: 2 });
      pinches.forEach((g) => {
        call(g, "onUpdate", e);
        call(g, "onChange", e);
      });
      if (wheelEnd) clearTimeout(wheelEnd);
      wheelEnd = setTimeout(() => {
        const end = baseEvent({ scale: wheelScale, state: State.END });
        pinches.forEach((g) => {
          call(g, "onEnd", end, true);
          call(g, "onFinalize", end, true);
        });
        wheelScale = 1;
        wheelEnd = null;
      }, 150);
    };

    const up = (ev: PointerEvent) => onUp(ev);
    const cancel = (ev: PointerEvent) => onUp(ev, true);
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      el.removeEventListener("wheel", onWheel);
      if (longPressTimer) clearTimeout(longPressTimer);
      if (wheelEnd) clearTimeout(wheelEnd);
    };
  }, []);

  // Keep the browser from scrolling/zooming while a drag gesture is tracked.
  useEffect(() => {
    const child = host.current?.firstElementChild as HTMLElement | null;
    if (child && needsTouchLock) child.style.touchAction = "none";
  });

  return (
    <div ref={host} style={{ display: "contents" }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

export function GestureHandlerRootView({ children, style, ...rest }: React.ComponentProps<typeof View>) {
  return (
    <View style={[{ flex: 1 }, style]} {...rest}>
      {children}
    </View>
  );
}

export function gestureHandlerRootHOC<P extends object>(Component: React.ComponentType<P>) {
  return function Wrapped(props: P) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Component {...props} />
      </GestureHandlerRootView>
    );
  };
}

export const TouchableOpacity = RNTouchableOpacity;
export const TouchableWithoutFeedback = RNTouchableWithoutFeedback;
export const FlatList = RNFlatList;
export const ScrollView = RNScrollView;
