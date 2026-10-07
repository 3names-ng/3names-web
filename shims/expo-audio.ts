// Web implementation of the expo-audio API used by the app:
//  - AudioPlayer: Web Audio (decoded AudioBuffer through a gain node), with an
//    <audio> fallback; expo's property/event surface
//    (`addListener("playbackStatusUpdate", ...)`, loop/muted/volume/rate).
//  - AudioRecorder: MediaRecorder; `uri` is a blob: URL of the recording.
"use client";

import { useEffect, useRef, useState } from "react";

export type AudioStatus = {
  id: number;
  currentTime: number;
  duration: number;
  playing: boolean;
  didJustFinish: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  loop: boolean;
  mute: boolean;
  volume: number;
  playbackRate: number;
  [key: string]: any;
};

export type AudioSource = string | number | { uri?: string | null } | null | undefined;
type PlayerOptions = { updateInterval?: number; downloadFirst?: boolean };
type Listener = (status: AudioStatus) => void;

function toUrl(source: AudioSource): string {
  if (!source) return "";
  if (typeof source === "string") return source;
  if (typeof source === "number") return String(source);
  return source.uri || "";
}

/* ------------------------------------------------------------------ */
/* Audio context + iOS unlock                                          */
/* ------------------------------------------------------------------ */

// iOS/iPadOS WebKit (Safari and Chrome on iPhone) only starts audio from a
// user gesture and never preloads <audio> before that. A Web Audio context
// unlocked once by a tap can start sounds from code for the rest of the
// session (e.g. a post's sound when its card scrolls into view), so players
// decode their file into an AudioBuffer and play it through the context.
// Anything that tried to start before the first tap starts on the next one.

let ctx: AudioContext | null = null;
const awaitingGesture = new Set<AudioPlayer>();

function getContext(): AudioContext | null {
  if (ctx || typeof window === "undefined") return ctx;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  installGestureUnlock();
  return ctx;
}

const isRunning = () => ctx?.state === "running";

function installGestureUnlock() {
  const unlock = () => {
    const c = ctx;
    if (!c) return;
    // iOS 17+: play as media, so the ring/silent switch doesn't mute it (like video sound).
    try {
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session && session.type !== "playback") session.type = "playback";
    } catch {
      // not supported
    }
    if (c.state !== "running") {
      // A buffer started inside the gesture is what unlocks older iOS versions.
      try {
        const silent = c.createBufferSource();
        silent.buffer = c.createBuffer(1, 1, 22050);
        silent.connect(c.destination);
        silent.start(0);
      } catch {
        // ignore
      }
      c.resume().catch(() => {});
    }
    // Retry blocked players while still inside the gesture (needed by the <audio> fallback).
    [...awaitingGesture].forEach((p) => p._retryFromGesture());
  };
  // Stays installed: iOS suspends the context again after calls/backgrounding.
  for (const type of ["touchend", "pointerup", "click", "keydown"]) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  }
  ctx?.addEventListener?.("statechange", () => {
    if (isRunning()) [...awaitingGesture].forEach((p) => p._retryFromGesture());
  });
}

// Decoded clips are reused when the same sound plays again (scrolling back up).
const bufferCache = new Map<string, Promise<AudioBuffer>>();
const MAX_CACHED = 24;

function loadBuffer(url: string): Promise<AudioBuffer> {
  const c = getContext();
  if (!c) return Promise.reject(new Error("Web Audio unavailable"));
  let p = bufferCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then(
        (data) =>
          new Promise<AudioBuffer>((resolve, reject) => {
            // Callback form: older iOS doesn't return a promise.
            const ret = c.decodeAudioData(data, resolve, reject);
            if (ret && typeof (ret as Promise<AudioBuffer>).then === "function") {
              (ret as Promise<AudioBuffer>).then(resolve, reject);
            }
          })
      );
    p.catch(() => bufferCache.delete(url));
    bufferCache.set(url, p);
    if (bufferCache.size > MAX_CACHED) bufferCache.delete(bufferCache.keys().next().value!);
  }
  return p;
}

/* ------------------------------------------------------------------ */
/* AudioPlayer                                                         */
/* ------------------------------------------------------------------ */

let nextId = 1;

export class AudioPlayer {
  readonly id = nextId++;
  private url = "";
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private interval: number;
  private released = false;
  private loadToken = 0;

  // settings (applied to whichever backend is active)
  private _loop = false;
  private _muted = false;
  private _volume = 1;
  private _rate = 1;
  private wantsPlay = false;
  private finished = false;

  // Web Audio backend
  private buffer: AudioBuffer | null = null;
  private gain: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private startedAt = 0; // context time when the current source started
  private startOffset = 0; // position (s) the current source started from
  private offset = 0; // position (s) while not playing

  // <audio> fallback (file couldn't be fetched/decoded)
  private el: HTMLAudioElement | null = null;

  constructor(source?: AudioSource, options?: PlayerOptions) {
    this.interval = options?.updateInterval ?? 500;
    this.replace(source);
  }

  /* ---------------- status ---------------- */

  private get position(): number {
    if (this.el) return this.el.currentTime;
    if (!this.source || !ctx) return this.offset;
    const elapsed = (ctx.currentTime - this.startedAt) * this._rate;
    const pos = this.startOffset + elapsed;
    const d = this.buffer?.duration ?? 0;
    if (!d) return pos;
    return this._loop ? pos % d : Math.min(pos, d);
  }

  get currentStatus(): AudioStatus {
    const el = this.el;
    return {
      id: this.id,
      currentTime: this.position,
      duration: el ? (Number.isFinite(el.duration) ? el.duration : 0) : this.buffer?.duration ?? 0,
      playing: this.playing,
      didJustFinish: this.finished,
      isLoaded: this.isLoaded,
      isBuffering: this.wantsPlay && !this.isLoaded,
      loop: this._loop,
      mute: this._muted,
      volume: this._volume,
      playbackRate: this._rate,
    };
  }

  private emit() {
    if (this.released) return;
    const status = this.currentStatus;
    this.listeners.forEach((l) => l(status));
  }

  private startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => this.emit(), this.interval);
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  addListener(event: string, listener: Listener) {
    if (event !== "playbackStatusUpdate") return { remove() {} };
    this.listeners.add(listener);
    return {
      remove: () => {
        this.listeners.delete(listener);
      },
    };
  }

  get isLoaded() {
    return this.el ? this.el.readyState >= 1 : !!this.buffer;
  }
  get playing() {
    return this.el ? !this.el.paused && !this.el.ended : !!this.source;
  }
  get currentTime() {
    return this.position;
  }
  get duration() {
    return this.currentStatus.duration;
  }

  /* ---------------- settings ---------------- */

  private applyGain() {
    if (this.gain) this.gain.gain.value = this._muted ? 0 : this._volume;
    if (this.el) {
      this.el.muted = this._muted;
      this.el.volume = this._volume; // read-only on iOS; gain covers the main path
    }
  }

  get loop() {
    return this._loop;
  }
  set loop(v: boolean) {
    this._loop = v;
    if (this.source) this.source.loop = v;
    if (this.el) this.el.loop = v;
  }
  get muted() {
    return this._muted;
  }
  set muted(v: boolean) {
    this._muted = v;
    this.applyGain();
  }
  get volume() {
    return this._volume;
  }
  set volume(v: number) {
    this._volume = Math.min(1, Math.max(0, v));
    this.applyGain();
  }
  get playbackRate() {
    return this._rate;
  }
  set playbackRate(v: number) {
    if (this.source && ctx) {
      // Rebase so the position stays continuous at the new speed.
      this.startOffset = this.position;
      this.startedAt = ctx.currentTime;
      this.source.playbackRate.value = v;
    }
    this._rate = v;
    if (this.el) this.el.playbackRate = v;
  }
  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
  }

  /* ---------------- loading ---------------- */

  replace(source: AudioSource) {
    const url = toUrl(source);
    if (url === this.url && (this.buffer || this.el)) return;
    this.stopSource();
    this.teardownElement();
    this.url = url;
    this.buffer = null;
    this.offset = 0;
    this.finished = false;
    const token = ++this.loadToken;
    if (!url || typeof window === "undefined") return;

    const c = getContext();
    if (!c) {
      this.useElement();
      return;
    }
    loadBuffer(url).then(
      (buffer) => {
        if (token !== this.loadToken || this.released) return;
        this.buffer = buffer;
        this.emit();
        if (this.wantsPlay) this.play();
      },
      (err) => {
        if (token !== this.loadToken || this.released) return;
        console.warn("[expo-audio] decode failed, using <audio> fallback:", err);
        this.useElement();
      }
    );
  }

  private useElement() {
    const el = new Audio();
    el.preload = "auto";
    el.loop = this._loop;
    el.playbackRate = this._rate;
    const emit = () => this.emit();
    el.addEventListener("loadedmetadata", emit);
    el.addEventListener("canplay", emit);
    el.addEventListener("play", () => {
      this.finished = false;
      this.startTimer();
      emit();
    });
    el.addEventListener("pause", () => {
      this.stopTimer();
      emit();
    });
    el.addEventListener("ended", () => {
      this.stopTimer();
      this.finished = true;
      emit();
      this.finished = false;
    });
    el.addEventListener("seeked", emit);
    el.src = this.url;
    if (this.offset) el.currentTime = this.offset;
    this.el = el;
    this.applyGain();
    el.load();
    if (this.wantsPlay) this.play();
  }

  private teardownElement() {
    const el = this.el;
    if (!el) return;
    el.pause();
    el.removeAttribute("src");
    el.load();
    this.el = null;
  }

  /* ---------------- transport ---------------- */

  play() {
    if (this.released) return;
    this.wantsPlay = true;
    if (this.el) {
      this.el.play().then(
        () => awaitingGesture.delete(this),
        (e: DOMException) => {
          if (e?.name === "NotAllowedError") awaitingGesture.add(this);
          else console.warn("[expo-audio] play failed:", e);
        }
      );
      return;
    }
    if (!this.buffer || this.source) return; // starts once decoded / already playing
    const c = getContext();
    if (!c) return;
    if (!isRunning()) {
      awaitingGesture.add(this);
      c.resume().catch(() => {}); // succeeds where autoplay is allowed (desktop)
      return;
    }
    awaitingGesture.delete(this);
    this.startSource(this.offset >= this.buffer.duration ? 0 : this.offset);
  }

  /** @internal Called by the unlock handler inside a user gesture. */
  _retryFromGesture() {
    if (!this.wantsPlay || this.playing) {
      awaitingGesture.delete(this);
      return;
    }
    if (this.el || isRunning()) this.play();
  }

  private startSource(offset: number) {
    const c = ctx!;
    if (!this.gain) {
      this.gain = c.createGain();
      this.gain.connect(c.destination);
      this.applyGain();
    }
    const src = c.createBufferSource();
    src.buffer = this.buffer;
    src.loop = this._loop;
    src.playbackRate.value = this._rate;
    src.connect(this.gain);
    src.onended = () => {
      if (this.source !== src) return; // stopped by pause/seek, not a natural end
      this.source = null;
      this.offset = this.buffer?.duration ?? 0;
      this.wantsPlay = false;
      this.stopTimer();
      this.finished = true;
      this.emit();
      this.finished = false;
    };
    src.start(0, Math.max(0, offset));
    this.source = src;
    this.startedAt = c.currentTime;
    this.startOffset = offset;
    this.finished = false;
    this.startTimer();
    this.emit();
  }

  private stopSource() {
    const src = this.source;
    if (!src) return;
    this.offset = this.position;
    this.source = null;
    src.onended = null;
    try {
      src.stop();
    } catch {
      // already stopped
    }
    src.disconnect();
    this.stopTimer();
  }

  pause() {
    this.wantsPlay = false;
    awaitingGesture.delete(this);
    if (this.el) {
      this.el.pause();
      return;
    }
    if (this.source) {
      this.stopSource();
      this.emit();
    }
  }

  async seekTo(seconds: number) {
    const target = Math.max(0, seconds);
    if (this.el) {
      this.el.currentTime = target;
      return;
    }
    if (this.source) {
      this.stopSource();
      this.startSource(target);
    } else {
      this.offset = target;
      this.emit();
    }
  }

  remove() {
    this.released = true;
    this.wantsPlay = false;
    awaitingGesture.delete(this);
    this.loadToken++;
    this.stopSource();
    this.teardownElement();
    this.gain?.disconnect();
    this.gain = null;
    this.stopTimer();
    this.listeners.clear();
  }
  release() {
    this.remove();
  }
}

export function createAudioPlayer(source?: AudioSource, options?: PlayerOptions): AudioPlayer {
  return new AudioPlayer(source, options);
}

export function useAudioPlayer(source?: AudioSource, options?: PlayerOptions): AudioPlayer {
  const [player] = useState(() => new AudioPlayer(source, options));
  const url = toUrl(source);
  useEffect(() => {
    player.replace(url);
  }, [player, url]);
  useEffect(() => () => player.remove(), [player]);
  return player;
}

export function useAudioPlayerStatus(player: AudioPlayer | null | undefined): AudioStatus {
  const [status, setStatus] = useState<AudioStatus>(() =>
    player ? player.currentStatus : (EMPTY_STATUS as AudioStatus)
  );
  useEffect(() => {
    if (!player) return;
    setStatus(player.currentStatus);
    const sub = player.addListener("playbackStatusUpdate", setStatus);
    return () => {
      sub.remove();
    };
  }, [player]);
  return status;
}

const EMPTY_STATUS = {
  id: 0,
  currentTime: 0,
  duration: 0,
  playing: false,
  didJustFinish: false,
  isLoaded: false,
  isBuffering: false,
  loop: false,
  mute: false,
  volume: 1,
  playbackRate: 1,
};

export async function setAudioModeAsync(_mode: Record<string, unknown>): Promise<void> {}
export async function setIsAudioActiveAsync(_active: boolean): Promise<void> {}

/* ------------------------------------------------------------------ */
/* Recording                                                           */
/* ------------------------------------------------------------------ */

export type RecordingOptions = {
  extension?: string;
  sampleRate?: number;
  numberOfChannels?: number;
  bitRate?: number;
  [key: string]: unknown;
};

export const RecordingPresets: Record<"HIGH_QUALITY" | "LOW_QUALITY", RecordingOptions> = {
  HIGH_QUALITY: { extension: ".m4a", sampleRate: 44100, numberOfChannels: 2, bitRate: 128000 },
  LOW_QUALITY: { extension: ".m4a", sampleRate: 44100, numberOfChannels: 1, bitRate: 64000 },
};

type PermissionResponse = {
  granted: boolean;
  status: "granted" | "denied" | "undetermined";
  canAskAgain: boolean;
  expires: "never";
};

export async function requestRecordingPermissionsAsync(): Promise<PermissionResponse> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return { granted: true, status: "granted", canAskAgain: true, expires: "never" };
  } catch {
    return { granted: false, status: "denied", canAskAgain: true, expires: "never" };
  }
}

export async function getRecordingPermissionsAsync(): Promise<PermissionResponse> {
  try {
    const p = await navigator.permissions.query({ name: "microphone" as PermissionName });
    const granted = p.state === "granted";
    return {
      granted,
      status: granted ? "granted" : p.state === "denied" ? "denied" : "undetermined",
      canAskAgain: p.state !== "denied",
      expires: "never",
    };
  } catch {
    return { granted: false, status: "undetermined", canAskAgain: true, expires: "never" };
  }
}

export type RecorderState = {
  canRecord: boolean;
  isRecording: boolean;
  durationMillis: number;
  mediaServicesDidReset: boolean;
  url: string | null;
};

export class AudioRecorder {
  uri: string | null = null;
  private options: RecordingOptions;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private accumulated = 0;
  private listeners = new Set<() => void>();

  constructor(options?: RecordingOptions) {
    this.options = options ?? RecordingPresets.HIGH_QUALITY;
  }

  get isRecording() {
    return this.recorder?.state === "recording";
  }

  get currentTime() {
    const running = this.isRecording ? Date.now() - this.startedAt : 0;
    return (this.accumulated + running) / 1000;
  }

  getStatus(): RecorderState {
    return {
      canRecord: !!this.recorder,
      isRecording: this.isRecording,
      durationMillis: Math.round(this.currentTime * 1000),
      mediaServicesDidReset: false,
      url: this.uri,
    };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async prepareToRecordAsync(_options?: RecordingOptions) {
    this.releaseStream();
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
      (t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)
    );
    this.recorder = new MediaRecorder(this.stream, {
      mimeType,
      audioBitsPerSecond: this.options.bitRate,
    });
    this.chunks = [];
    this.accumulated = 0;
    this.uri = null;
    this.recorder.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.notify();
  }

  record() {
    if (!this.recorder) return;
    if (this.recorder.state === "paused") this.recorder.resume();
    else if (this.recorder.state === "inactive") this.recorder.start(250);
    this.startedAt = Date.now();
    this.notify();
  }

  pause() {
    if (this.recorder?.state !== "recording") return;
    this.recorder.pause();
    this.accumulated += Date.now() - this.startedAt;
    this.notify();
  }

  async stop() {
    const rec = this.recorder;
    if (!rec || rec.state === "inactive") return;
    if (rec.state === "recording") this.accumulated += Date.now() - this.startedAt;
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.stop();
    });
    const blob = new Blob(this.chunks, { type: rec.mimeType || "audio/webm" });
    if (this.uri) URL.revokeObjectURL(this.uri);
    this.uri = URL.createObjectURL(blob);
    this.releaseStream();
    this.notify();
  }

  private releaseStream() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  release() {
    if (this.recorder?.state !== "inactive") this.recorder?.stop();
    this.releaseStream();
    this.recorder = null;
  }

  addListener(_event: string, _listener: (...args: unknown[]) => void) {
    return { remove() {} };
  }
}

export function useAudioRecorder(options?: RecordingOptions, _statusListener?: unknown): AudioRecorder {
  const [recorder] = useState(() => new AudioRecorder(options));
  useEffect(() => () => recorder.release(), [recorder]);
  return recorder;
}

export function useAudioRecorderState(recorder: AudioRecorder, interval = 500): RecorderState {
  const [state, setState] = useState<RecorderState>(() => recorder.getStatus());
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;
  useEffect(() => {
    const update = () => setState(recorderRef.current.getStatus());
    const unsubscribe = recorder.subscribe(update);
    const id = setInterval(update, interval);
    return () => {
      unsubscribe();
      clearInterval(id);
    };
  }, [recorder, interval]);
  return state;
}
