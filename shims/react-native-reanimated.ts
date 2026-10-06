// Web stand-in for react-native-reanimated, driven by requestAnimationFrame.
//
// Shared values are observable boxes. Assigning an animation (withTiming,
// withSpring, withRepeat, ...) to `.value` runs it frame by frame, and every
// component whose useAnimatedStyle/useDerivedValue read that value re-renders
// on each change. Only numbers are interpolated; other values jump.
// Layout animations (entering/exiting) render without motion.
"use client";

import React, { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { Easing as RNEasing, FlatList, Image, ScrollView, Text, View } from "react-native";

export const Easing = RNEasing;

/* ------------------------------------------------------------------ */
/* Animations                                                          */
/* ------------------------------------------------------------------ */

type Step = (now: number) => { value: unknown; done: boolean };
type AnimationCallback = (finished?: boolean, current?: unknown) => void;

interface AnimationSpec {
  __reanimatedAnimation: true;
  /** Starts the animation from `from`; returns a per-frame stepper. */
  start(from: unknown, now: number): Step;
  callback?: AnimationCallback;
}

const isAnimation = (v: unknown): v is AnimationSpec =>
  !!v && typeof v === "object" && (v as AnimationSpec).__reanimatedAnimation === true;

const asNumber = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

function toSpec(v: unknown): AnimationSpec {
  if (isAnimation(v)) return v;
  return { __reanimatedAnimation: true, start: () => () => ({ value: v, done: true }) };
}

/** Value an animation would end on, used to chain sequences/repeats. */
function finalValue(spec: AnimationSpec, from: unknown): unknown {
  const step = spec.start(from, 0);
  let r = step(Number.MAX_SAFE_INTEGER / 2);
  for (let i = 0; !r.done && i < 10_000; i++) r = step(Number.MAX_SAFE_INTEGER / 2);
  return r.value;
}

type TimingConfig = { duration?: number; easing?: (t: number) => number; reduceMotion?: unknown };

export function withTiming<T>(toValue: T, config?: TimingConfig, callback?: AnimationCallback): T {
  const duration = config?.duration ?? 300;
  const easing = config?.easing ?? RNEasing.inOut(RNEasing.quad);
  const spec: AnimationSpec = {
    __reanimatedAnimation: true,
    callback,
    start(from, t0) {
      if (typeof toValue !== "number" || typeof from !== "number" || duration <= 0) {
        return () => ({ value: toValue, done: true });
      }
      return (now) => {
        const p = Math.min(1, (now - t0) / duration);
        return { value: from + (toValue - from) * easing(p), done: p >= 1 };
      };
    },
  };
  return spec as unknown as T;
}

type SpringConfig = {
  damping?: number;
  stiffness?: number;
  mass?: number;
  velocity?: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
  [k: string]: unknown;
};

export function withSpring<T>(toValue: T, config?: SpringConfig, callback?: AnimationCallback): T {
  const k = config?.stiffness ?? 100;
  const c = config?.damping ?? 10;
  const m = config?.mass ?? 1;
  const restD = config?.restDisplacementThreshold ?? 0.001;
  const restV = config?.restSpeedThreshold ?? 2;
  const spec: AnimationSpec = {
    __reanimatedAnimation: true,
    callback,
    start(from, t0) {
      if (typeof toValue !== "number" || typeof from !== "number") {
        return () => ({ value: toValue, done: true });
      }
      let x = from - toValue;
      let v = config?.velocity ?? 0;
      let last = t0;
      return (now) => {
        // Fixed-step semi-implicit Euler integration, capped per frame.
        let dt = Math.min(64, Math.max(0, now - last)) / 1000;
        last = now;
        while (dt > 0) {
          const h = Math.min(dt, 1 / 240);
          const a = (-k * x - c * v) / m;
          v += a * h;
          x += v * h;
          dt -= h;
        }
        if (config?.overshootClamping && Math.sign(x) !== Math.sign(from - toValue)) x = 0;
        const done = Math.abs(x) < restD * Math.max(1, Math.abs(toValue)) && Math.abs(v) < restV;
        return { value: done ? toValue : toValue + x, done };
      };
    },
  };
  return spec as unknown as T;
}

export function withDecay(config: { velocity?: number; deceleration?: number; clamp?: [number, number] }, callback?: AnimationCallback): number {
  const spec: AnimationSpec = {
    __reanimatedAnimation: true,
    callback,
    start(from, t0) {
      const v0 = config?.velocity ?? 0;
      const decel = config?.deceleration ?? 0.998;
      const start = asNumber(from);
      return (now) => {
        const t = now - t0;
        const k = Math.pow(decel, t);
        let value = start + (v0 / 1000) * (1 - k) / (1 - decel);
        const speed = Math.abs(v0 * k);
        if (config?.clamp) value = Math.min(config.clamp[1], Math.max(config.clamp[0], value));
        return { value, done: speed < 1 };
      };
    },
  };
  return spec as unknown as number;
}

export function withDelay<T>(delayMs: number, animation: T): T {
  const inner = toSpec(animation);
  const spec: AnimationSpec = {
    __reanimatedAnimation: true,
    callback: inner.callback,
    start(from, t0) {
      let step: Step | null = null;
      return (now) => {
        if (now - t0 < delayMs) return { value: from, done: false };
        if (!step) step = inner.start(from, t0 + delayMs);
        return step(now);
      };
    },
  };
  return spec as unknown as T;
}

export function withSequence<T>(...animations: T[]): T {
  const specs = animations.map(toSpec);
  const spec: AnimationSpec = {
    __reanimatedAnimation: true,
    start(from, t0) {
      let i = 0;
      let current = from;
      let step = specs.length ? specs[0].start(from, t0) : null;
      return (now) => {
        while (step) {
          const r = step(now);
          current = r.value;
          if (!r.done) return { value: current, done: false };
          specs[i].callback?.(true, current);
          i++;
          step = i < specs.length ? specs[i].start(current, now) : null;
        }
        return { value: current, done: true };
      };
    },
  };
  return spec as unknown as T;
}

export function withRepeat<T>(animation: T, numberOfReps = 2, reverse = false, callback?: AnimationCallback): T {
  const inner = toSpec(animation);
  const spec: AnimationSpec = {
    __reanimatedAnimation: true,
    callback,
    start(from, t0) {
      const forwardEnd = finalValue(inner, from);
      let rep = 0;
      let backwards = false;
      let step = inner.start(from, t0);
      return (now) => {
        const r = step(now);
        if (!r.done) return r;
        rep++;
        if (numberOfReps > 0 && rep >= numberOfReps) return { value: r.value, done: true };
        if (reverse) {
          backwards = !backwards;
          // Run the same animation back towards the starting value.
          const target = backwards ? from : forwardEnd;
          step = retarget(inner, target).start(r.value, now);
        } else {
          step = inner.start(from, now);
        }
        return { value: r.value, done: false };
      };
    },
  };
  return spec as unknown as T;
}

/** Same timing/spring curve, aimed at a different end value (for reversing). */
function retarget(spec: AnimationSpec, target: unknown): AnimationSpec {
  return {
    __reanimatedAnimation: true,
    start(from, t0) {
      const fwd = spec.start(from, t0);
      const naturalEnd = finalValue(spec, from);
      if (typeof from !== "number" || typeof naturalEnd !== "number" || typeof target !== "number") {
        return () => ({ value: target, done: true });
      }
      const span = naturalEnd - from;
      return (now) => {
        const r = fwd(now);
        const p = span === 0 ? 1 : (asNumber(r.value) - from) / span;
        return { value: from + (target - from) * p, done: r.done };
      };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Shared values                                                       */
/* ------------------------------------------------------------------ */

let collecting: Set<SharedValueImpl<unknown>> | null = null;

class SharedValueImpl<T> {
  private _value: T;
  private listeners = new Set<() => void>();
  private frame: number | null = null;

  constructor(initial: T) {
    this._value = initial;
  }

  get value(): T {
    collecting?.add(this as SharedValueImpl<unknown>);
    return this._value;
  }

  set value(next: T) {
    this.cancel();
    if (isAnimation(next)) this.run(next);
    else this.commit(next);
  }

  get(): T {
    return this.value;
  }

  set(next: T | ((prev: T) => T)) {
    this.value = typeof next === "function" ? (next as (p: T) => T)(this._value) : next;
  }

  modify(fn: (v: T) => T) {
    this.value = fn(this._value);
  }

  addListener(_id: number, listener: (v: T) => void) {
    const l = () => listener(this._value);
    this.listeners.add(l);
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  cancel() {
    if (this.frame != null && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  private commit(next: T) {
    if (Object.is(next, this._value)) return;
    this._value = next;
    this.listeners.forEach((l) => l());
  }

  private run(spec: AnimationSpec) {
    if (typeof requestAnimationFrame === "undefined") {
      this.commit(finalValue(spec, this._value) as T);
      spec.callback?.(true, this._value);
      return;
    }
    const startNow = performance.now();
    const step = spec.start(this._value, startNow);
    const tick = (now: number) => {
      const r = step(now);
      this.commit(r.value as T);
      if (r.done) {
        this.frame = null;
        spec.callback?.(true, r.value);
      } else {
        this.frame = requestAnimationFrame(tick);
      }
    };
    this.frame = requestAnimationFrame(tick);
  }
}

export type SharedValue<T = unknown> = {
  value: T;
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  modify(fn: (v: T) => T): void;
};
export type DerivedValue<T = unknown> = Readonly<SharedValue<T>>;

export function makeMutable<T>(initial: T): SharedValue<T> {
  return new SharedValueImpl(initial);
}

export function useSharedValue<T>(initial: T): SharedValue<T> {
  const [sv] = useState(() => new SharedValueImpl(initial));
  useEffect(() => () => sv.cancel(), [sv]);
  return sv;
}

export function cancelAnimation(sharedValue: SharedValue<any> | null | undefined): void {
  if (sharedValue instanceof SharedValueImpl) sharedValue.cancel();
}

/** Runs `factory`, re-rendering the component whenever a shared value it read changes. */
function useTracked<R>(factory: () => R): R {
  const [, force] = useReducer((c: number) => c + 1, 0);
  const deps = new Set<SharedValueImpl<unknown>>();
  const prev = collecting;
  collecting = deps;
  let result: R;
  try {
    result = factory();
  } catch (e) {
    console.warn("[reanimated] worklet threw:", e);
    result = {} as R;
  } finally {
    collecting = prev;
  }

  const depsKey = useRef<Set<SharedValueImpl<unknown>>>(deps);
  depsKey.current = deps;
  useLayoutEffect(() => {
    const unsubs = [...depsKey.current].map((sv) => sv.subscribe(force));
    return () => unsubs.forEach((u) => u());
  });
  return result;
}

export function useAnimatedStyle<T extends Record<string, any>>(factory: () => T, _deps?: unknown[]): T {
  return useTracked(factory);
}

export function useAnimatedProps<T>(factory: () => T, _deps?: unknown[]): T {
  return useTracked(factory);
}

export function useDerivedValue<T>(factory: () => T, _deps?: unknown[]): DerivedValue<T> {
  const value = useTracked(factory);
  const [sv] = useState(() => new SharedValueImpl(value));
  sv.value = value;
  return sv;
}

export function useAnimatedReaction<T>(
  prepare: () => T,
  react: (current: T, previous: T | null) => void,
  _deps?: unknown[]
) {
  const current = useTracked(prepare);
  const prev = useRef<T | null>(null);
  useEffect(() => {
    if (!Object.is(current, prev.current)) {
      react(current, prev.current);
      prev.current = current;
    }
  });
}

/* ------------------------------------------------------------------ */
/* Threads / misc                                                      */
/* ------------------------------------------------------------------ */

export function runOnJS<A extends any[], R>(fn: (...args: A) => R): (...args: A) => void {
  return (...args: A) => {
    fn(...args);
  };
}
export const runOnUI = runOnJS;
export const scheduleOnRN = runOnJS;
export const runOnRuntime = runOnJS;

export function useEvent(_handler: unknown, _deps?: unknown[], _rebuild?: boolean) {
  return (_event: unknown) => {};
}

export function useAnimatedRef<T = any>() {
  return useRef<T | null>(null);
}

export function useAnimatedScrollHandler(_handlers: unknown) {
  return (_event: unknown) => {};
}

export function useFrameCallback(callback: (info: { timestamp: number; timeSincePreviousFrame: number | null }) => void, autostart = true) {
  const cb = useRef(callback);
  cb.current = callback;
  const [active, setActive] = useState(autostart);
  useEffect(() => {
    if (!active) return;
    let id = 0;
    let last: number | null = null;
    const loop = (t: number) => {
      cb.current({ timestamp: t, timeSincePreviousFrame: last == null ? null : t - last });
      last = t;
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
  return { setActive, isActive: active, callbackId: 0 };
}

export function measure(_ref: unknown) {
  return null as null | { width: number; height: number; x: number; y: number; pageX: number; pageY: number };
}

export enum Extrapolation {
  IDENTITY = "identity",
  CLAMP = "clamp",
  EXTEND = "extend",
}
export const Extrapolate = Extrapolation;

type ExtrapolationArg =
  | Extrapolation
  | `${Extrapolation}`
  | { extrapolateLeft?: Extrapolation | `${Extrapolation}`; extrapolateRight?: Extrapolation | `${Extrapolation}` };

export function interpolate(x: number, input: readonly number[], output: readonly number[], type?: ExtrapolationArg): number {
  if (input.length < 2 || output.length < 2) return output[0] ?? 0;
  const left = typeof type === "object" ? type.extrapolateLeft ?? "extend" : type ?? "extend";
  const right = typeof type === "object" ? type.extrapolateRight ?? "extend" : type ?? "extend";
  let i = 1;
  while (i < input.length - 1 && x > input[i]) i++;
  const [x0, x1, y0, y1] = [input[i - 1], input[i], output[i - 1], output[i]];
  if (x < input[0]) {
    if (left === "clamp") return output[0];
    if (left === "identity") return x;
  }
  if (x > input[input.length - 1]) {
    if (right === "clamp") return output[output.length - 1];
    if (right === "identity") return x;
  }
  if (x1 === x0) return y0;
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

export function interpolateColor(x: number, input: readonly number[], output: readonly string[]): string {
  // Picks the nearest stop; enough for the app's discrete color states.
  let best = 0;
  for (let i = 0; i < input.length; i++) if (Math.abs(x - input[i]) < Math.abs(x - input[best])) best = i;
  return output[best];
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/* ------------------------------------------------------------------ */
/* Layout animations: accepted, rendered without motion               */
/* ------------------------------------------------------------------ */

type LayoutAnimationBuilder = {
  __layoutAnimation: string;
  duration(ms?: number): LayoutAnimationBuilder;
  delay(ms?: number): LayoutAnimationBuilder;
  springify(): LayoutAnimationBuilder;
  damping(v?: number): LayoutAnimationBuilder;
  stiffness(v?: number): LayoutAnimationBuilder;
  mass(v?: number): LayoutAnimationBuilder;
  dampingRatio(v?: number): LayoutAnimationBuilder;
  easing(e?: unknown): LayoutAnimationBuilder;
  withCallback(cb?: unknown): LayoutAnimationBuilder;
  withInitialValues(v?: unknown): LayoutAnimationBuilder;
  randomDelay(): LayoutAnimationBuilder;
  reduceMotion(v?: unknown): LayoutAnimationBuilder;
};

function layoutAnimation(name: string): LayoutAnimationBuilder {
  const b = { __layoutAnimation: name } as LayoutAnimationBuilder;
  for (const m of ["duration", "delay", "springify", "damping", "stiffness", "mass", "dampingRatio", "easing", "withCallback", "withInitialValues", "randomDelay", "reduceMotion"]) {
    (b as any)[m] = () => b;
  }
  return b;
}

export const FadeIn = layoutAnimation("FadeIn");
export const FadeOut = layoutAnimation("FadeOut");
export const FadeInDown = layoutAnimation("FadeInDown");
export const FadeInUp = layoutAnimation("FadeInUp");
export const FadeInLeft = layoutAnimation("FadeInLeft");
export const FadeInRight = layoutAnimation("FadeInRight");
export const FadeOutDown = layoutAnimation("FadeOutDown");
export const FadeOutUp = layoutAnimation("FadeOutUp");
export const FadeOutLeft = layoutAnimation("FadeOutLeft");
export const FadeOutRight = layoutAnimation("FadeOutRight");
export const SlideInDown = layoutAnimation("SlideInDown");
export const SlideOutDown = layoutAnimation("SlideOutDown");
export const SlideInUp = layoutAnimation("SlideInUp");
export const SlideOutUp = layoutAnimation("SlideOutUp");
export const SlideInLeft = layoutAnimation("SlideInLeft");
export const SlideInRight = layoutAnimation("SlideInRight");
export const SlideOutLeft = layoutAnimation("SlideOutLeft");
export const SlideOutRight = layoutAnimation("SlideOutRight");
export const ZoomIn = layoutAnimation("ZoomIn");
export const ZoomOut = layoutAnimation("ZoomOut");
export const ZoomInEasyUp = layoutAnimation("ZoomInEasyUp");
export const ZoomOutEasyDown = layoutAnimation("ZoomOutEasyDown");
export const BounceIn = layoutAnimation("BounceIn");
export const BounceOut = layoutAnimation("BounceOut");
export const Layout = layoutAnimation("Layout");
export const LinearTransition = layoutAnimation("LinearTransition");

export enum ReanimatedLogLevel {
  warn = 1,
  error = 2,
}

export function configureReanimatedLogger(_config: { level?: ReanimatedLogLevel; strict?: boolean }): void {}

export enum ReduceMotion {
  System = "system",
  Always = "always",
  Never = "never",
}

export function useReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/* Animated components                                                 */
/* ------------------------------------------------------------------ */

const LAYOUT_PROPS = ["entering", "exiting", "layout", "sharedTransitionTag", "sharedTransitionStyle", "animatedProps"];

export function createAnimatedComponent<P extends object>(Component: React.ComponentType<P>) {
  const Wrapped = React.forwardRef<unknown, P & Record<string, unknown>>((props, ref) => {
    const { animatedProps, ...rest } = props as Record<string, unknown>;
    const clean: Record<string, unknown> = { ...rest, ...(animatedProps as object | undefined) };
    for (const k of LAYOUT_PROPS) delete clean[k];
    return React.createElement(Component as React.ComponentType<any>, { ...clean, ref });
  });
  Wrapped.displayName = `Reanimated(${Component.displayName || Component.name || "Component"})`;
  return Wrapped as unknown as React.ComponentType<
    P & { entering?: unknown; exiting?: unknown; layout?: unknown; animatedProps?: Partial<P> }
  >;
}

const AnimatedNS = {
  View: createAnimatedComponent(View),
  Text: createAnimatedComponent(Text),
  Image: createAnimatedComponent(Image),
  ScrollView: createAnimatedComponent(ScrollView),
  FlatList: createAnimatedComponent(FlatList as React.ComponentType<any>),
  createAnimatedComponent,
};

export default AnimatedNS;
