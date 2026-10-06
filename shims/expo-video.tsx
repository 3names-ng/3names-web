// Web implementation of the expo-video API used by the app. A VideoPlayer
// holds the source and settings (loop, muted, volume, rate) and drives the
// <video> element that <VideoView> renders, emitting expo-video's events:
// statusChange, playingChange, playToEnd, timeUpdate, sourceChange, mutedChange.
"use client";

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";

export type VideoPlayerStatus = "idle" | "loading" | "readyToPlay" | "error";
export type VideoSource = string | number | { uri?: string | null } | null | undefined;

type EventMap = {
  statusChange: { status: VideoPlayerStatus; error?: { message: string } };
  playingChange: { isPlaying: boolean };
  playToEnd: void;
  timeUpdate: { currentTime: number };
  sourceChange: { source: VideoSource };
  mutedChange: { muted: boolean };
  volumeChange: { volume: number };
};
type EventName = keyof EventMap;
type Handler<E extends EventName> = (payload: EventMap[E]) => void;

function toUrl(source: VideoSource): string {
  if (!source) return "";
  if (typeof source === "string") return source;
  if (typeof source === "number") return String(source);
  return source.uri || "";
}

export class VideoPlayer {
  private el: HTMLVideoElement | null = null;
  private url: string;
  private listeners = new Map<EventName, Set<(p: any) => void>>();
  private wantsPlay = false;
  private _loop = false;
  private _muted = false;
  private _volume = 1;
  private _rate = 1;
  private _status: VideoPlayerStatus = "idle";
  private detachEvents: (() => void) | null = null;

  constructor(source: VideoSource) {
    this.url = toUrl(source);
    if (this.url) this._status = "loading";
  }

  addListener<E extends EventName>(event: E, handler: Handler<E>) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return {
      remove: () => {
        this.listeners.get(event)?.delete(handler);
      },
    };
  }

  removeAllListeners(event?: EventName) {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
  }

  private emit<E extends EventName>(event: E, payload: EventMap[E]) {
    this.listeners.get(event)?.forEach((h) => h(payload));
  }

  private setStatus(status: VideoPlayerStatus, error?: string) {
    this._status = status;
    this.emit("statusChange", { status, error: error ? { message: error } : undefined });
  }

  /** Called by <VideoView> when its <video> mounts/unmounts. */
  _attach(el: HTMLVideoElement | null) {
    if (this.el === el) return;
    this.detachEvents?.();
    this.detachEvents = null;
    this.el = el;
    if (!el) return;

    el.loop = this._loop;
    el.muted = this._muted;
    el.volume = this._volume;
    el.playbackRate = this._rate;
    if (el.getAttribute("src") !== this.url) {
      if (this.url) el.src = this.url;
      else el.removeAttribute("src");
    }

    const on = (type: string, fn: () => void) => {
      el.addEventListener(type, fn);
      return () => el.removeEventListener(type, fn);
    };
    const offs = [
      on("loadstart", () => this.url && this.setStatus("loading")),
      on("canplay", () => {
        if (this._status !== "readyToPlay") this.setStatus("readyToPlay");
        if (this.wantsPlay) this.play();
      }),
      on("error", () => this.setStatus("error", el.error?.message || "Video failed to load")),
      on("play", () => this.emit("playingChange", { isPlaying: true })),
      on("pause", () => this.emit("playingChange", { isPlaying: false })),
      on("ended", () => this.emit("playToEnd", undefined)),
      on("timeupdate", () => this.emit("timeUpdate", { currentTime: el.currentTime })),
    ];
    this.detachEvents = () => offs.forEach((off) => off());
    if (this.wantsPlay) this.play();
  }

  get status() {
    return this._status;
  }
  get isLoaded() {
    return this._status === "readyToPlay";
  }
  get playing() {
    return !!this.el && !this.el.paused && !this.el.ended;
  }
  get currentTime() {
    return this.el?.currentTime ?? 0;
  }
  set currentTime(v: number) {
    if (this.el) this.el.currentTime = v;
  }
  get duration() {
    return this.el && Number.isFinite(this.el.duration) ? this.el.duration : 0;
  }
  get loop() {
    return this._loop;
  }
  set loop(v: boolean) {
    this._loop = v;
    if (this.el) this.el.loop = v;
  }
  get muted() {
    return this._muted;
  }
  set muted(v: boolean) {
    this._muted = v;
    if (this.el) this.el.muted = v;
    this.emit("mutedChange", { muted: v });
  }
  get volume() {
    return this._volume;
  }
  set volume(v: number) {
    this._volume = Math.min(1, Math.max(0, v));
    if (this.el) this.el.volume = this._volume;
    this.emit("volumeChange", { volume: this._volume });
  }
  get playbackRate() {
    return this._rate;
  }
  set playbackRate(v: number) {
    this._rate = v;
    if (this.el) this.el.playbackRate = v;
  }

  play() {
    this.wantsPlay = true;
    const el = this.el;
    if (!el || !this.url) return;
    el.play().catch((e: DOMException) => {
      // Autoplay with sound is blocked until the user interacts; retry muted
      // so the video still starts, as on mobile.
      if (e?.name === "NotAllowedError" && !el.muted) {
        el.muted = true;
        this._muted = true;
        this.emit("mutedChange", { muted: true });
        el.play().catch(() => {});
      }
    });
  }
  pause() {
    this.wantsPlay = false;
    this.el?.pause();
  }
  replay() {
    this.currentTime = 0;
    this.play();
  }
  seekBy(seconds: number) {
    if (this.el) this.el.currentTime += seconds;
  }
  seekTo(seconds: number) {
    this.currentTime = seconds;
  }
  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
  }
  replace(source: VideoSource) {
    this.url = toUrl(source);
    this.emit("sourceChange", { source });
    if (this.el) {
      if (this.url) this.el.src = this.url;
      else this.el.removeAttribute("src");
    }
    this.setStatus(this.url ? "loading" : "idle");
  }
  async replaceAsync(source: VideoSource) {
    this.replace(source);
  }
  release() {
    this.pause();
    this.detachEvents?.();
    this.listeners.clear();
    this.el = null;
  }
  remove() {
    this.release();
  }
}

export function createVideoPlayer(source: VideoSource): VideoPlayer {
  return new VideoPlayer(source);
}

export function useVideoPlayer(source: VideoSource, setup?: (player: VideoPlayer) => void): VideoPlayer {
  const url = toUrl(source);
  const [player, setPlayer] = useState(() => {
    const p = new VideoPlayer(source);
    setup?.(p);
    return p;
  });
  const first = useRef(true);
  const setupRef = useRef(setup);
  setupRef.current = setup;

  // Like expo-video, a new source creates a new player (and reruns setup).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const p = new VideoPlayer(url);
    setupRef.current?.(p);
    setPlayer(p);
  }, [url]);

  useEffect(() => () => player.release(), [player]);
  return player;
}

export interface VideoViewProps {
  player: VideoPlayer;
  style?: any;
  nativeControls?: boolean;
  contentFit?: "contain" | "cover" | "fill";
  allowsFullscreen?: boolean;
  allowsPictureInPicture?: boolean;
  onFirstFrameRender?: () => void;
  [key: string]: any;
}

export const VideoView = React.forwardRef<HTMLVideoElement, VideoViewProps>(function VideoView(
  { player, style, nativeControls = true, contentFit = "contain", allowsFullscreen, onFirstFrameRender },
  ref
) {
  const setRef = (el: HTMLVideoElement | null) => {
    player?._attach(el);
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  useEffect(() => () => player?._attach(null), [player]);

  const flat = (StyleSheet.flatten(style) ?? {}) as React.CSSProperties;
  return (
    <video
      ref={setRef}
      controls={nativeControls}
      controlsList={allowsFullscreen === false ? "nofullscreen" : undefined}
      playsInline
      preload="metadata"
      onLoadedData={onFirstFrameRender}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        backgroundColor: "black",
        ...flat,
        objectFit: contentFit,
      }}
    />
  );
});

export default VideoView;
