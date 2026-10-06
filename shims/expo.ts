"use client";

import { useEffect, useRef, useState } from "react";

type Subscription = { remove: () => void };
type EmitterLike = {
  addListener?: (event: any, handler: any) => Subscription;
  addEventListener?: (type: string, handler: any) => void;
  removeEventListener?: (type: string, handler: any) => void;
};

function subscribe(target: EmitterLike, event: string, listener: (...args: any[]) => void): () => void {
  if (typeof target.addListener === "function") {
    const sub = target.addListener(event, listener);
    return () => sub.remove();
  }
  if (typeof target.addEventListener === "function") {
    target.addEventListener(event, listener);
    return () => target.removeEventListener?.(event, listener);
  }
  return () => {};
}

/** expo's useEventListener: subscribes to an emitter (expo-video/expo-audio players). */
export function useEventListener(
  target: EmitterLike | null | undefined,
  eventName: string,
  handler: (...args: any[]) => void
) {
  const saved = useRef(handler);
  saved.current = handler;

  useEffect(() => {
    if (!target) return;
    return subscribe(target, eventName, (...args) => saved.current(...args));
  }, [target, eventName]);
}

/** expo's useEvent: the latest payload of an event as state. */
export function useEvent<T = any>(
  target: EmitterLike | null | undefined,
  eventName: string,
  initialValue: T | null = null
): T | null {
  const [value, setValue] = useState<T | null>(initialValue);
  useEventListener(target, eventName, (payload: T) => setValue(payload));
  return value;
}

export default { useEventListener, useEvent };
