/**
 * VoiceMessageBubble — WhatsApp-style waveform voice note player.
 * Extracted from chatScreen.tsx. Only one voice note plays at a time
 * across the entire app (tracked via module-level `activeVoiceNotePlayer`).
 */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioPlayer,
} from "expo-audio";
import { ThemedText } from "@/components/ui/ThemedText";
import { useWaveformStore } from "@/store/waveformStore";
import { formatDuration, SCREEN_WIDTH } from "@/components/chat/shared/chatTypes";

// Voice note playback speeds (WhatsApp-style)
const VOICE_NOTE_SPEEDS = [1, 1.5, 2, 2.5, 3];

// Module-level reference so only one voice note plays at a time
let activeVoiceNotePlayer: AudioPlayer | null = null;

interface VoiceMessageBubbleProps {
  uri: string;
  tintColor: string;
  buttonColor: string;
  trackColor: string;
  mutedTextColor: string;
}

export default function VoiceMessageBubble({
  uri,
  tintColor,
  buttonColor,
  trackColor,
  mutedTextColor,
}: VoiceMessageBubbleProps) {
  const settings = useWaveformStore();
  const player = useAudioPlayer(uri, { updateInterval: 150 });
  const status = useAudioPlayerStatus(player);
  const [speedIndex, setSpeedIndex] = useState(0);
  const isPlaying = status.playing;

  // Ensure playback is audible even with the iOS silent switch on
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Deterministic waveform bars derived from the URI — same note, same shape
  const bars = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < uri.length; i++) {
      seed = (seed * 31 + uri.charCodeAt(i)) >>> 0;
    }
    return Array.from({ length: settings.barCount }, (_, i) => {
      const n = Math.sin(seed + i * 12.9898) * 43758.5453;
      const frac = n - Math.floor(n);
      return 0.3 + frac * 0.7;
    });
  }, [uri, settings.barCount]);

  const barAnims = useRef<Animated.Value[]>([]);
  if (barAnims.current.length !== settings.barCount) {
    barAnims.current = Array.from(
      { length: settings.barCount },
      () => new Animated.Value(1),
    );
  }

  // Animate the wave while playing; reset when paused/finished
  useEffect(() => {
    if (!isPlaying) {
      barAnims.current.forEach((anim) => anim.setValue(1));
      pulseAnim.setValue(1);
      return;
    }

    const perBar = barAnims.current.map((anim) =>
      Animated.sequence([
        Animated.timing(anim, {
          toValue: settings.pulseDip,
          duration: settings.pulseDuration,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: settings.pulseDuration,
          useNativeDriver: true,
        }),
      ]),
    );

    const waveLoop = Animated.loop(
      Animated.stagger(settings.waveStagger, perBar),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: settings.pulseDuration,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: settings.pulseDuration,
          useNativeDriver: true,
        }),
      ]),
    );

    waveLoop.start();
    pulseLoop.start();
    return () => {
      waveLoop.stop();
      pulseLoop.stop();
      barAnims.current.forEach((anim) => anim.setValue(1));
      pulseAnim.setValue(1);
    };
  }, [isPlaying, settings, pulseAnim]);

  // Clear the active reference when this player unmounts
  useEffect(() => {
    return () => {
      if (activeVoiceNotePlayer === player) activeVoiceNotePlayer = null;
    };
  }, [player]);

  const togglePlayback = async () => {
    if (status.playing) {
      player.pause();
      return;
    }

    // Pause any other voice note playing
    if (activeVoiceNotePlayer && activeVoiceNotePlayer !== player) {
      activeVoiceNotePlayer.pause();
    }

    player.setPlaybackRate(VOICE_NOTE_SPEEDS[speedIndex]);

    // A finished (or fully-scrubbed) player needs an explicit seek back to
    // the start — calling play() again after the end is otherwise a no-op.
    const finishedPlaying =
      status.didJustFinish ||
      (status.duration > 0 && status.currentTime >= status.duration - 0.05);
    if (finishedPlaying) {
      await player.seekTo(0);
    }

    player.play();
    activeVoiceNotePlayer = player;
  };

  // Cycle the playback speed: 1x -> 1.5x -> 2x -> 2.5x -> 3x
  const cycleSpeed = () => {
    const next = (speedIndex + 1) % VOICE_NOTE_SPEEDS.length;
    setSpeedIndex(next);
    player.setPlaybackRate(VOICE_NOTE_SPEEDS[next]);
  };

  // Played bars use the user-chosen tint, falling back to the bubble's text color
  const playedColor = settings.tintColor || tintColor;

  const duration = status.duration || 0;
  const currentTime = status.currentTime || 0;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const timeLabel = formatDuration(
    isPlaying || currentTime > 0 ? currentTime : duration,
  );

  return (
    <View
      style={{ width: SCREEN_WIDTH * 0.55 }}
      className="flex-row items-center mb-1.5"
    >
      <Animated.View
        style={{ marginRight: 10, transform: [{ scale: pulseAnim }] }}
      >
        <TouchableOpacity
          onPress={togglePlayback}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: buttonColor,
          }}
          className="justify-center items-center"
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={16}
            color={tintColor}
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          />
        </TouchableOpacity>
      </Animated.View>
      <View className="flex-1">
        {/* Animated waveform — bars pulse while playing, played portion is tinted */}
        <View
          style={{ height: settings.maxHeight + 4, justifyContent: "center" }}
        >
          {/* Unplayed (track) bars */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: settings.barGap,
            }}
          >
            {bars.map((h, i) => (
              <Animated.View
                key={i}
                style={{
                  width: settings.barWidth,
                  height: Math.max(3, settings.maxHeight * h),
                  borderRadius: 1.5,
                  backgroundColor: trackColor,
                  opacity: settings.trackOpacity,
                  transform: [{ scaleY: barAnims.current[i] }],
                }}
              />
            ))}
          </View>
          {/* Played bars — clipped to the current progress */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress * 100}%`,
              overflow: "hidden",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: settings.barGap,
              }}
            >
              {bars.map((h, i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: settings.barWidth,
                    height: Math.max(3, settings.maxHeight * h),
                    borderRadius: 1.5,
                    backgroundColor: playedColor,
                    transform: [{ scaleY: barAnims.current[i] }],
                  }}
                />
              ))}
            </View>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <ThemedText
            style={{ color: mutedTextColor, marginTop: 3 }}
            className="text-[10px]"
          >
            {timeLabel}
          </ThemedText>

          {/* Playback speed toggle */}
          <TouchableOpacity
            onPress={cycleSpeed}
            hitSlop={8}
            className="mt-0.5 px-1.5 py-0.5 rounded-md"
            style={{ borderWidth: 1, borderColor: trackColor }}
          >
            <ThemedText
              style={{ color: playedColor, fontSize: 9, fontWeight: "700" }}
            >
              {VOICE_NOTE_SPEEDS[speedIndex]}x
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
