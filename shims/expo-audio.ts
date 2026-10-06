// Web implementation of the expo-audio API used by the app:
//  - AudioPlayer: HTMLAudioElement with expo's property/event surface
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

let nextId = 1;

export class AudioPlayer {
  readonly id = nextId++;
  private audio: HTMLAudioElement | null;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private finished = false;
  private interval: number;

  constructor(source?: AudioSource, options?: PlayerOptions) {
    this.interval = options?.updateInterval ?? 500;
    this.audio = typeof Audio !== "undefined" ? new Audio() : null;
    const a = this.audio;
    if (!a) return;
    a.preload = "auto";
    const emit = () => this.emit();
    a.addEventListener("loadedmetadata", emit);
    a.addEventListener("canplay", emit);
    a.addEventListener("play", () => {
      this.finished = false;
      this.startTimer();
      emit();
    });
    a.addEventListener("pause", () => {
      this.stopTimer();
      emit();
    });
    a.addEventListener("ended", () => {
      this.stopTimer();
      this.finished = true;
      emit();
      this.finished = false;
    });
    a.addEventListener("seeked", emit);
    a.addEventListener("waiting", emit);
    if (toUrl(source)) a.src = toUrl(source);
  }

  private startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => this.emit(), this.interval);
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private emit() {
    const status = this.currentStatus;
    this.listeners.forEach((l) => l(status));
  }

  get currentStatus(): AudioStatus {
    const a = this.audio;
    return {
      id: this.id,
      currentTime: a?.currentTime ?? 0,
      duration: a && Number.isFinite(a.duration) ? a.duration : 0,
      playing: !!a && !a.paused && !a.ended,
      didJustFinish: this.finished,
      isLoaded: !!a && a.readyState >= 1,
      isBuffering: !!a && a.readyState < 3 && !a.paused,
      loop: a?.loop ?? false,
      mute: a?.muted ?? false,
      volume: a?.volume ?? 1,
      playbackRate: a?.playbackRate ?? 1,
    };
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
    return this.currentStatus.isLoaded;
  }
  get playing() {
    return this.currentStatus.playing;
  }
  get currentTime() {
    return this.audio?.currentTime ?? 0;
  }
  get duration() {
    return this.currentStatus.duration;
  }
  get loop() {
    return this.audio?.loop ?? false;
  }
  set loop(v: boolean) {
    if (this.audio) this.audio.loop = v;
  }
  get muted() {
    return this.audio?.muted ?? false;
  }
  set muted(v: boolean) {
    if (this.audio) this.audio.muted = v;
  }
  get volume() {
    return this.audio?.volume ?? 1;
  }
  set volume(v: number) {
    if (this.audio) this.audio.volume = Math.min(1, Math.max(0, v));
  }
  get playbackRate() {
    return this.audio?.playbackRate ?? 1;
  }
  set playbackRate(v: number) {
    if (this.audio) this.audio.playbackRate = v;
  }

  play() {
    this.audio?.play().catch((e) => console.warn("[expo-audio] play failed:", e));
  }
  pause() {
    this.audio?.pause();
  }
  async seekTo(seconds: number) {
    if (this.audio) this.audio.currentTime = seconds;
  }
  setPlaybackRate(rate: number) {
    this.playbackRate = rate;
  }
  replace(source: AudioSource) {
    const a = this.audio;
    if (!a) return;
    const url = toUrl(source);
    if (a.src === url) return;
    a.pause();
    a.src = url;
    if (url) a.load();
  }
  remove() {
    this.stopTimer();
    this.listeners.clear();
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
    }
    this.audio = null;
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
