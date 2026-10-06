// components/VideoPlayerItem.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from 'expo-router';
import { useSoundSettingsStore } from '@/store/soundSettingsStore';

// The platform player controls (scrubber, play/pause, timecodes) render inside
// this strip at the bottom of the video. The tap/long-press overlay below has to
// stop above it, otherwise it swallows the touches the scrubber needs.
const NATIVE_CONTROLS_HEIGHT = 110;

interface VideoPlayerItemProps {
  videoUrl?: string | null;
  isActive: boolean;
  width: number;
  height?: number;
  contentFit?: 'contain' | 'cover' | 'fill';
  /** Playback speed chosen from the feed's long-press options sheet. */
  playbackRate?: number;
  /** Long-press on the video surface (the feed opens its options sheet). */
  onLongPress?: () => void;
  /** 0–1. Lowered when the post has a sound playing over the video. */
  volume?: number;
  /** Opens the feed's options sheet. */
  onSettingsPress?: () => void;
  /** Px from the bottom where the native controls sit (above the tab bar). */
  controlsBottomOffset?: number;
  /** Video started/stopped playing — including the user's play/pause on the native controls. */
  onPlayingChange?: (isPlaying: boolean) => void;
}

export default function VideoPlayerItem({
  videoUrl,
  isActive,
  width,
  height = 600,
  contentFit = 'contain',
  playbackRate = 1,
  onLongPress,
  volume = 1,
  onPlayingChange,
}: VideoPlayerItemProps) {
  const [paused, setPaused] = useState(false);
  const muted = useSoundSettingsStore((s) => s.muted);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  // A missing/empty url (e.g. a still-processing upload) must resolve to
  // `null`, not "" -- expo-video treats "" as a real (invalid) file:// uri
  // and logs AVFoundation "Cannot Open" errors trying to load it.
  const player = useVideoPlayer(videoUrl || null, (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.muted = false;
    playerInstance.pause();
  });

  // Report play/pause (the native controls pause the player directly, so this
  // is the only way the feed learns of it — e.g. to pause the post's sound)
  const onPlayingChangeRef = useRef(onPlayingChange);
  onPlayingChangeRef.current = onPlayingChange;
  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying }) => {
      onPlayingChangeRef.current?.(isPlaying);
    });
    return () => sub.remove();
  }, [player]);

  // Apply the speed picked in the long-press sheet.
  useEffect(() => {
    try {
      // expo-video exposes the speed as a writable property (there is no
      // setter method), so the assignment is the documented API.
      // eslint-disable-next-line react-hooks/immutability
      player.playbackRate = playbackRate;
    } catch {
      // Player already released — nothing left to configure.
    }
  }, [player, playbackRate]);

  // Global mute toggle, and the post's mix (video audio under its sound)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/immutability
      player.muted = muted;
      player.volume = volume;
    } catch {
      // Player already released.
    }
  }, [player, muted, volume]);

  // A new speed means the user just chose it from the sheet, so clear any
  // earlier pause: the video plays again (at the new rate) as soon as the
  // sheet closes and the post becomes active again. Adjusting state during
  // render, rather than in an effect, avoids a second render pass.
  const [lastAppliedRate, setLastAppliedRate] = useState(playbackRate);
  if (lastAppliedRate !== playbackRate) {
    setLastAppliedRate(playbackRate);
    setPaused(false);
  }

  const stopPlayback = useCallback(() => {
    try {
      player.pause();
    } catch {
      // expo-video releases the native player when this component unmounts.
      // Calling pause() after that throws NativeSharedObjectNotFoundException,
      // so swallowing it here prevents the crash during cleanup.
    }
  }, [player]);

  useFocusEffect(
    useCallback(() => {
      if (videoUrl && isActive && !paused) {
        player.play();
      } else {
        stopPlayback();
      }

      return () => {
        stopPlayback();
      };
    }, [videoUrl, isActive, paused, player, stopPlayback]),
  );

  useEffect(() => {
    if (videoUrl && isActive && !paused) {
      player.play();
    } else {
      stopPlayback();
    }

    return () => {
      stopPlayback();
    };
  }, [videoUrl, isActive, paused, player, stopPlayback]);

  const togglePlayPause = () => {
    if (!videoUrl) return;
    if (paused) {
      player.play();
      setPaused(false);
    } else {
      player.pause();
      setPaused(true);
    }
    // Briefly show the play/pause icon
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 800);
  };

  return (
    <View style={{ width, height }} className="relative justify-center items-center bg-black overflow-hidden">
      {/* Native (platform) controls give us the draggable seek bar, play/pause
          and timecodes for free — including on Android, where a hand-rolled
          scrubber kept losing the gesture to the feed's scroll view. */}
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        nativeControls
        contentFit={contentFit}
      />
      {/* Tap overlay for play/pause (long press bubbles up to the feed's
          options sheet). It stops above the native controls so it never
          covers the scrubber. */}
      {/* <Pressable
        onPress={togglePlayPause}
        onLongPress={onLongPress}
        delayLongPress={350}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: NATIVE_CONTROLS_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {showPlayIcon && (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name={paused ? 'play' : 'pause'}
              size={28}
              color="#FFFFFF"
            />
          </View>
        )}
      </Pressable> */}
    </View>
  );
}
