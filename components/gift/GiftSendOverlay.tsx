import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getRarityConfig } from './rarityStyles';
import type { Gifts as UIGift, RarityConfig } from './GiftGridItem';
import { useTheme } from '@/hooks/useTheme';
import { useGiftVideoCache } from '@/hooks/useGiftVideoCache';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface GiftSendOverlayRef {
  show: (gift: UIGift, senderName?: string, count?: number) => void;
}

interface CurrentAnimationState {
  gift: UIGift;
  senderName: string;
  count: number;
}

// Video that auto-plays once for the duration of the overlay and is
// released (paused + cleaned up) as soon as it unmounts. Notifies the
// parent via `onFinish` when playback reaches the very end (or errors),
// so the overlay can close only after the video has fully played.
function FlyingGiftVideo({ videoUri, onFinish }: { videoUri: string; onFinish?: () => void }) {
  const player = useVideoPlayer(videoUri, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.muted = false;
    playerInstance.play();
  });

  useEventListener(player, 'playToEnd', () => {
    onFinish?.();
  });

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') onFinish?.();
  });

  return (
    <View style={styles.flyingVideo} pointerEvents="none">
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

const GiftSendOverlay = forwardRef<GiftSendOverlayRef, {}>(function GiftSendOverlay(_, ref) {
  const [current, setCurrent] = useState<CurrentAnimationState | null>(null);
  const { colors } = useTheme();
  const { getCachedUri } = useGiftVideoCache();
  
  // Adjusted to accept both string (UUIDs) and number IDs safely
  const activeGiftTracker = useRef<{ id: string | number; currentCount: number } | null>(null);
  const activeSequence = useRef<Animated.CompositeAnimation | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bannerAnim = useRef(new Animated.Value(0)).current;
  const mainAnim = useRef(new Animated.Value(0)).current; 
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  // Tracks whether the banner is currently shown, so re-sending the same
  // gift skips re-sliding it in. (Avoids reading Animated internals.)
  const bannerVisibleRef = useRef(false);

  const clearHoldTimer = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  // Fades the video + banner out, then dismisses the overlay.
  const runExit = useCallback(() => {
    if (!activeGiftTracker.current) return; // already dismissed
    if (activeSequence.current) activeSequence.current.stop();
    clearHoldTimer();
    bannerVisibleRef.current = false;

    const exitSeq = Animated.parallel([
      Animated.timing(mainAnim, { toValue: 1, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bannerAnim, { toValue: 0, duration: 450, easing: Easing.in(Easing.cubic), useNativeDriver: true })
    ]);

    activeSequence.current = exitSeq;
    exitSeq.start(({ finished }) => {
      if (finished) {
        setCurrent(null);
        activeGiftTracker.current = null;
        activeSequence.current = null;
      }
    });
  }, [mainAnim, bannerAnim, clearHoldTimer]);

  // Called by FlyingGiftVideo when the video has fully played (or errored).
  // Holds the final frame for a brief moment so the fade-out doesn't feel
  // abrupt, then runs the exit animation.
  const handleVideoEnd = useCallback(() => {
    clearHoldTimer();
    holdTimer.current = setTimeout(() => {
      runExit();
    }, 500);
  }, [runExit, clearHoldTimer]);

  useImperativeHandle(ref, () => ({
    show(gift: UIGift, senderName = 'You', count?: number) {
      // Never let a malformed gift crash the overlay.
      if (!gift || gift.id === undefined || gift.id === null) return;

      if (activeSequence.current) {
        activeSequence.current.stop();
      }
      clearHoldTimer();

      let targetCount = 1;

      // An explicit count (e.g. the total combo sent) wins; otherwise keep
      // the per-gift increment for repeated single sends.
      if (typeof count === 'number' && count > 0) {
        targetCount = count;
        activeGiftTracker.current = { id: gift.id, currentCount: count };
      } else if (activeGiftTracker.current && activeGiftTracker.current.id === gift.id) {
        activeGiftTracker.current.currentCount += 1;
        targetCount = activeGiftTracker.current.currentCount;
      } else {
        activeGiftTracker.current = { id: gift.id, currentCount: 1 };
      }

      setCurrent({ gift, senderName, count: targetCount });

      mainAnim.setValue(0);
      badgeScaleAnim.setValue(1);

      const isBannerVisible = bannerVisibleRef.current;

      Animated.sequence([
        Animated.timing(badgeScaleAnim, { toValue: 1.6, duration: 80, useNativeDriver: true }),
        Animated.spring(badgeScaleAnim, { toValue: 1.0, friction: 4, tension: 40, useNativeDriver: true })
      ]).start();

      // Entrance: banner slides in while the gift scales up.
      const entrance = Animated.parallel([
        Animated.timing(bannerAnim, { 
          toValue: 1, 
          duration: isBannerVisible ? 0 : 450, 
          easing: Easing.out(Easing.back(1.1)), 
          useNativeDriver: true 
        }),
        Animated.timing(mainAnim, { toValue: 0.25, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true })
      ]);

      activeSequence.current = entrance;
      bannerVisibleRef.current = true;

      entrance.start(({ finished }) => {
        if (!finished) return;

        // Hold: drift the gift slightly while waiting for the video to
        // finish. `handleVideoEnd` (via playToEnd) triggers the exit, and
        // the timer is a safety net for gifts without a video or a video
        // that errors without ever firing playToEnd.
        const hold = Animated.timing(mainAnim, { toValue: 0.85, duration: 6000, easing: Easing.linear, useNativeDriver: true });
        activeSequence.current = hold;
        hold.start();

        holdTimer.current = setTimeout(() => {
          runExit();
        }, gift.videoUrl ? 20000 : 6000);
      });
    },
  }));

  if (!current) return null;
  
  // Safe layout configuration fallback if rarity strings mismatch
  const config = (getRarityConfig(current.gift.rarity) || { borderColor: colors.border }) as RarityConfig;
  
  // Uniform casing check to capture string definitions smoothly (e.g. 'DRIVE' or 'drive')
  const animationType = String(current.gift.animationUrl || '').toUpperCase();

  let translateX: Animated.AnimatedInterpolation<number> = mainAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
  let translateY: Animated.AnimatedInterpolation<number> = mainAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
  let scale: Animated.AnimatedInterpolation<number> = mainAnim.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0.2, 1.2, 1.2, 0] });
  let opacity: Animated.AnimatedInterpolation<number> = mainAnim.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
  let rotate: Animated.AnimatedInterpolation<string> = mainAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '0deg'] });

  // Matching variations against string patterns
  if (animationType.includes('DRIVE')) {
    translateX = mainAnim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_WIDTH * 0.9, -SCREEN_WIDTH * 0.9] });
    scale = mainAnim.interpolate({ inputRange: [0, 0.2, 0.5, 0.85, 1], outputRange: [0.6, 1.2, 1.4, 1.2, 0.6] });
    rotate = mainAnim.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '-5deg'] });
  } else if (animationType.includes('FLOAT')) {
    translateY = mainAnim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [250, -80, -300] });
    scale = mainAnim.interpolate({ inputRange: [0, 0.2, 0.5, 0.85, 1], outputRange: [0.4, 1.2, 1.05, 1.15, 0] });
  } else if (animationType.includes('BOUNCE')) {
    translateY = mainAnim.interpolate({ 
      inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.85, 1], 
      outputRange: [300, -100, 60, -30, 20, -5, 0, -200] 
    });
  } else if (animationType.includes('PULSE')) {
    scale = mainAnim.interpolate({ 
      inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.85, 1], 
      outputRange: [0.3, 1.3, 0.95, 1.3, 0.95, 1.3, 1.1, 0] 
    });
  } else if (animationType.includes('SPIN')) {
    rotate = mainAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1800deg'] });
  } else if (animationType.includes('DROP')) {
    translateY = mainAnim.interpolate({ 
      inputRange: [0, 0.25, 0.35, 0.45, 0.85, 1], 
      outputRange: [-SCREEN_HEIGHT / 2, 0, -30, 0, 10, SCREEN_HEIGHT / 3] 
    });
  } else if (animationType.includes('FLY') || animationType.includes('ROCKET')) {
    translateX = mainAnim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [-180, SCREEN_WIDTH * 0.2, SCREEN_WIDTH * 0.7] });
    translateY = mainAnim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [350, -40, -SCREEN_HEIGHT * 0.6] });
  } else if (animationType.includes('SAIL')) {
    translateX = mainAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-220, 0, 220] });
    translateY = mainAnim.interpolate({ 
      inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], 
      outputRange: [80, 20, 80, 20, 80, 120] 
    });
  } else if (animationType.includes('SHAKE')) {
    translateX = mainAnim.interpolate({
      inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      outputRange: [0, -25, 25, -25, 25, -20, 20, -15, 15, 0, 0]
    });
  } else if (animationType.includes('EXPLODE') || animationType.includes('COSMIC')) {
    scale = mainAnim.interpolate({ inputRange: [0, 0.7, 0.85, 1], outputRange: [0.1, 1.5, 3.2, 0] });
    opacity = mainAnim.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] });
  } else {
    // Default safe floating engine parameter pathway
    translateY = mainAnim.interpolate({ inputRange: [0, 0.85, 1], outputRange: [140, -40, -160] });
  }

  const bannerTranslateX = bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [-350, 0] });

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.banner,
          { borderColor: config.borderColor, transform: [{ translateX: bannerTranslateX }] },
        ]}
      >
        {/* <Text style={styles.bannerIcon}>{current.gift.icon || '🎁'}</Text> */}
        <View style={styles.textContainer}>
          <Text style={styles.bannerSender} numberOfLines={1}>{current.senderName}</Text>
          <Text style={styles.bannerText} numberOfLines={1}>sent {current.gift.name}</Text>
        </View>
        
        <Animated.Text 
          style={[
            styles.bannerBadge, 
            { color: colors.primary, transform: [{ scale: badgeScaleAnim }] }
          ]}
        >
          x{current.count}
        </Animated.Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.flyingVideoContainer,
          {
            opacity: opacity,
            transform: [
              { translateX: translateX },
              { translateY: translateY },
              { scale: scale },
              { rotate: rotate }
            ],
          },
        ]}
      >
        {(() => {
          const uri = getCachedUri(current.gift);
          if (uri && uri.trim().length > 0) {
            return (
              <FlyingGiftVideo
                key={`${current.gift.id}-${current.count}`}
                videoUri={uri}
                onFinish={handleVideoEnd}
              />
            );
          }
          return <Text style={styles.flyingIcon}>{current.gift.icon || '🎁'}</Text>;
        })()}
      </Animated.View>
    </View>
  );
});

export default GiftSendOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 999,              
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',    
    top: 54, 
    left: 16,
    backgroundColor: 'rgba(20,20,26,0.95)',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    elevation: 5,
  },
  bannerIcon: {
    fontSize: 26,
    marginRight: 8,
  },
  textContainer: {
    maxWidth: 160, 
  },
  bannerSender: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  bannerText: {
    color: '#D8D8E0',
    fontSize: 12,
  },
  bannerBadge: {
    marginLeft: 12,
    fontWeight: '900',
    fontSize: 20,
    fontStyle: 'italic',
  },
  flyingVideoContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyingVideo: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  flyingIcon: {
    position: 'absolute',
    fontSize: 220, 
    textAlign: 'center',
  },
});