import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { createAudioPlayer, type AudioPlayer, type AudioStatus } from "expo-audio";

/**
 * AudioPlayer is a SharedObject that emits "playbackStatusUpdate" (expo-audio's
 * own useAudioPlayerStatus listens to it), but its addListener type doesn't
 * resolve through the SharedObject base here — so the signature is spelled out.
 */
type StatusEmitter = {
  addListener(event: "playbackStatusUpdate", listener: (status: AudioStatus) => void): { remove(): void };
};

import { SOUND_CLIP_MS, type SoundSelection } from "@/service/sound.service";
import { useSoundSettingsStore } from "@/store/soundSettingsStore";
import { cachedClipUri, clipSource, prefetchClip } from "@/utils/soundClip";

/**
 * Plays a post/story sound while `active` is true, looping the chosen clip
 * (from `startMs`, up to SOUND_CLIP_MS) like TikTok.
 *
 * The player only exists while active, so a feed full of sounds doesn't load
 * them all at once; it's released as soon as the item scrolls away.
 * Respects the global mute toggle.
 */
export function useSoundPlayback(
  selection: SoundSelection | null,
  active: boolean,
  options: {
    loop?: boolean;
    /** Previews in the picker play even when the feed is muted */
    ignoreMute?: boolean;
    /** Pause without losing the position (e.g. a story held down) */
    paused?: boolean;
    /** Change it to jump back to the clip start (e.g. each new camera recording) */
    restartKey?: number;
    /**
     * Stream the whole song instead of the cut clip — for choosing the start
     * point, where a new clip per slider position would be slow.
     */
    fullTrack?: boolean;
  } = {},
) {
  const loop = options.loop ?? true;
  const paused = options.paused ?? false;

  // Stop when the screen loses focus (switching tabs, opening another screen)
  // or the app goes to the background — the caller's `active` doesn't know.
  const [focused, setFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => setAppActive(state === "active"));
    return () => sub.remove();
  }, []);
  active = active && focused && appActive;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const globalMuted = useSoundSettingsStore((s) => s.muted);
  const muted = options.ignoreMute ? false : globalMuted;
  const playerRef = useRef<AudioPlayer | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Just the clip that plays (cut by Cloudinary, ~0.4 MB) — starts far faster
  // than streaming the whole song and seeking into it
  const source = useMemo(
    () => (selection ? clipSource(selection, options.fullTrack) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selection?.sound.id, selection?.sound.audioUrl, selection?.sound.durationMs, selection?.startMs, options.fullTrack],
  );
  const url = source?.url ?? null;
  const startSec = source?.startSec ?? 0;
  const endSec = source?.endSec ?? SOUND_CLIP_MS / 1000;
  const volume = selection?.soundVolume ?? 1;

  useEffect(() => {
    if (!active || !url || !source) return;

    // Play from the phone if the clip was prefetched; otherwise stream it and
    // cache it for next time
    const localUri = cachedClipUri(source);
    if (!localUri) void prefetchClip(source);
    const player = createAudioPlayer({ uri: localUri ?? url }, { updateInterval: 250 });
    player.volume = volume;
    player.muted = mutedRef.current;
    playerRef.current = player;

    let started = false;
    let finished = false;

    const sub = (player as unknown as StatusEmitter).addListener("playbackStatusUpdate", (status) => {
      if (!started && status.isLoaded) {
        started = true;
        if (startSec > 0) player.seekTo(startSec);
        if (!pausedRef.current) player.play();
        return;
      }
      if (!started || finished) return;
      if (status.didJustFinish || status.currentTime >= endSec) {
        if (loop) {
          player.seekTo(startSec);
          if (!pausedRef.current) player.play();
        } else {
          finished = true;
          player.pause();
        }
      }
    });

    return () => {
      sub.remove();
      // remove() only drops the JS reference — the native player can keep
      // sounding until it's garbage-collected — so silence it explicitly first.
      try {
        player.pause();
        player.volume = 0;
      } catch {
        // already released
      }
      player.remove();
      if (playerRef.current === player) playerRef.current = null;
    };
    // volume/mute are applied below without restarting playback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, url, startSec, endSec, loop]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.volume = volume;
    player.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !player.isLoaded) return;
    try {
      if (paused) player.pause();
      else player.play();
    } catch {
      // released
    }
  }, [paused]);

  // Back to the start of the clip (skipped on first render — loading already seeks there)
  const firstRestart = useRef(true);
  useEffect(() => {
    if (firstRestart.current) {
      firstRestart.current = false;
      return;
    }
    const player = playerRef.current;
    if (!player || !player.isLoaded) return;
    try {
      player.seekTo(startSec);
      if (!pausedRef.current) player.play();
    } catch {
      // released
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.restartKey]);
}
