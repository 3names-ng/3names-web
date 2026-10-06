import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  DeviceEventEmitter,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useEventListener } from "expo";
import { VideoView, useVideoPlayer } from "expo-video";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemedText } from "@/components/ui/ThemedText";
import { LevelBadge } from "../levelBadge";
import { ProfileFrame } from "../ui/ProfileFrame";
import { Eye, Gift } from "lucide-react-native";
import { formatCount } from "@/service/helper";
import { storyService } from "@/service/story.service";
import GiftSendOverlay, { GiftSendOverlayRef } from "../gift/GiftSendOverlay";
import FloatingComboButton from "../gift/floatingComboButton";
import GiftModal from "../gift/GiftModal";
import { Gifts } from "../gift/GiftGridItem";
import StoryPeopleListModal from "./storyPeopleListModal";
import { showError } from "../ui/toast";
import { coinService, giftService, GiftTargetType } from "@/service/post.service";
import { useAuthStore } from "@/store/authStore";
import ReportContentSheet from "../ui/reportContentSheet";
import { selectionFrom, type Sound } from "@/service/sound.service";
import { useSoundPlayback } from "@/hooks/useSoundPlayback";
import { useSoundSettingsStore } from "@/store/soundSettingsStore";
import { SoundLabel } from "../sound/soundTag";
import SoundInfoSheet from "../sound/soundInfoSheet";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DEFAULT_STORY_DURATION = 5000;
/** Photo/text stories with a sound */
const SOUND_STORY_DURATION = 15000;

const AVAILABLE_EMOJIS = ["❤️", "😂", "😮", "😢", "👏", "🔥"];

export interface StoryItem {
  id: string;
  mediaUrl?: string; 
  type: "image" | "video" | "text"; 
  timestamp: string;
  textContent?: string;
  backgroundColor?: string;
  textAlign?: "center" | "left" | "right" | string;
  level?: {
    id: string;
    level: number;
    title: string;
    badge: string;
    emoji: string;
    color: string; 
    minXp: number;
    maxXp: number;
    rewardCoins: number;
    perks: string[];
  };
  viewCount?: number;
  giftsCount?: number;
  reactionsCount?: number;
  myReaction?: string | null;
  // Sound played with the story (sound is null if none / taken down)
  sound?: Sound | null;
  soundStartMs?: number;
  soundVolume?: number;
  originalVolume?: number;
}

export interface UserStoryGroup {
  userId: string;
  userName: string;
  userAvatar: string;
  profileFrame?: string | null;
  stories: StoryItem[];
  level?: {
    id: string;
    level: number;
    title: string;
    badge: string;
    emoji: string;
    color: string; 
    minXp: number;
    maxXp: number;
    rewardCoins: number;
    perks: string[];
    viewCount: number;
    giftsCount: number;
    reactionsCount: number;
  };
  viewCount?: number;
  giftsCount?: number;
  reactionsCount?: number;
}

interface StoryViewerProps {
  userStories: UserStoryGroup;
  onClose: () => void;
  onFinish?: () => void;
  onPrevious?: () => void;
  onStoryUpdated?: (storyId: string, updates: { giftsCount?: number }) => void;
  initialIndex?: number;
}

/**
 * Plays a single video story with expo-video. Reports the loaded duration
 * (ms), buffering state and the moment playback reaches the end, mirroring
 * the expo-av status callbacks the story viewer previously used.
 */
function VideoStorySegment({
  uri,
  playing,
  onDuration,
  onLoadingChange,
  onEnded,
  volume = 1,
}: {
  uri: string;
  playing: boolean;
  onDuration: (millis: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onEnded: () => void;
  /** Lowered when the story has a sound over it */
  volume?: number;
}) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.muted = false;
  });
  const muted = useSoundSettingsStore((s) => s.muted);

  useEffect(() => {
    try {
      player.muted = muted;
      player.volume = volume;
    } catch {
      // released
    }
  }, [player, muted, volume]);

  // Mirror the parent's pause state (finger down, pickers open, loading...)
  useEffect(() => {
    try {
      if (playing) {
        player.play();
      } else {
        player.pause();
      }
    } catch {
      // Player may already be released while the story is switching away.
    }
  }, [playing, player]);

  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "loading") {
      onLoadingChange(true);
    } else if (status === "readyToPlay") {
      onLoadingChange(false);
      const seconds = player.duration;
      if (seconds && seconds > 0) onDuration(seconds * 1000);
    } else if (status === "error") {
      onLoadingChange(false);
    }
  });

  useEventListener(player, "playToEnd", onEnded);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function StoryViewerScreen({
  userStories,
  onClose,
  onFinish,
  onPrevious,
  onStoryUpdated,
  initialIndex = 0,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Reaction states
  const [reactionCounts, setReactionCounts] = useState<{ [storyId: string]: number }>({});
  const [activeReactionMap, setActiveReactionMap] = useState<{ [storyId: string]: string | null }>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Mirrors activeReactionMap so an in-flight reaction request can tell, once
  // it resolves, whether the user has since tapped again (and skip applying
  // a now-stale server count on top of a newer optimistic value).
  const activeReactionMapRef = useRef(activeReactionMap);
  useEffect(() => {
    activeReactionMapRef.current = activeReactionMap;
  }, [activeReactionMap]);

  // Gifting states
  const [showGifts, setShowGifts] = useState(false);

  const [giftsCounts, setGiftsCounts] = useState<{ [storyId: string]: number }>({});
  const [coins, setCoins] = useState(100000);
  const [activeComboGift, setActiveComboGift] = useState<Gifts | null>(null);

  // Viewers/reactions/gifters lists (owner only) — each modal fetches and
  // paginates its own data once opened, keyed by the current story's id.
  const [showViewers, setShowViewers] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showGifters, setShowGifters] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const pickerAnim = useRef(new Animated.Value(0)).current; 
  const globalOverlayRef = useRef<GiftSendOverlayRef | null>(null);
  const viewedStoryIds = useRef<Set<string>>(new Set());

  // Guards against double-advancing when the progress bar and the video's
  // playToEnd event fire within the same moment (expo-av's didJustFinish
  // used to race the same way). Clears itself shortly after each advance.
  const advanceLockRef = useRef(false);
  const advanceLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Distinguishes a quick tap (navigate) from a press-and-hold (pause only).
  // TouchableWithoutFeedback fires onPress on release regardless of how long
  // the finger was down, so without this a hold-then-release on the right
  // edge of the last story would advance past it and close the viewer.
  const pressStartRef = useRef(0);
  const TAP_MAX_DURATION_MS = 250;

  const currentStory = userStories.stories[currentIndex];
  const insets = useSafeAreaInsets();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwnStory = Boolean(
    currentUserId && userStories.userId && currentUserId === userStories.userId,
  );

  const fetchBalance = async () => {
    try {
      const response = await coinService.getBalance();
      const currentBalance = typeof response?.balance === "number" ? response.balance : response;
      setCoins(currentBalance);
    } catch (error) {
      console.error("Error fetching live coin balance:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    if (userStories.stories.length > 0) {
      const initialCounts: { [storyId: string]: number } = {};
      const initialActive: { [storyId: string]: string | null } = {};
      const initialGifts: { [storyId: string]: number } = {};
      userStories.stories.forEach(story => {
        initialCounts[story.id] = story.reactionsCount || 0;
        initialActive[story.id] = story.myReaction ?? null;
        initialGifts[story.id] = story.giftsCount || 0;
      });
      setReactionCounts(initialCounts);
      setActiveReactionMap(initialActive);
      setGiftsCounts(initialGifts);
    }
  }, [userStories]);

  // Register a view for the current story the first time it's shown
  // (the backend dedupes per viewer, so re-visits never double-count).
  useEffect(() => {
    if (!currentStory || viewedStoryIds.current.has(currentStory.id)) return;
    viewedStoryIds.current.add(currentStory.id);
    storyService.getStory(currentStory.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.id]);

  // Reset video states when switching stories
  useEffect(() => {
    setVideoDuration(null);
    setIsVideoLoading(currentStory?.type === "video");
  }, [currentIndex]);

  const [showReport, setShowReport] = useState(false);
  const [soundSheetVisible, setSoundSheetVisible] = useState(false);

  const shouldPause =
    isPaused ||
    showReport ||
    soundSheetVisible ||
    showEmojiPicker ||
    showGifts ||
    showViewers ||
    showReactions ||
    showGifters ||
    activeComboGift !== null ||
    isVideoLoading;

  // Sound over the story (any type). Kept across holds/pauses; a new player per story.
  const storySound = React.useMemo(
    () => (currentStory ? selectionFrom(currentStory) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStory?.id],
  );
  useSoundPlayback(storySound, !!storySound, { paused: shouldPause });
  const muted = useSoundSettingsStore((s) => s.muted);
  const toggleMuted = useSoundSettingsStore((s) => s.toggleMuted);

  // Handle progress timer animation
  useEffect(() => {
    progressAnim.setValue(0);

    // Photo/text stories with a sound stay up longer so the song can play
    const duration = currentStory?.type === "video" && videoDuration
      ? videoDuration
      : currentStory?.sound
        ? SOUND_STORY_DURATION
        : DEFAULT_STORY_DURATION;

    if (!shouldPause) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          handleNext();
        }
      });
    }

    return () => {
      progressAnim.stopAnimation();
    };
  }, [currentIndex, shouldPause, videoDuration]);

  // On your own story, the gift icon shows who has gifted it instead of
  // opening the picker — you can't send a gift to yourself.
  const handleOpenGiftPicker = () => {
    if (isOwnStory) {
      handleOpenGifters();
      return;
    }
    setShowGifts(true);
  };

  const handleOpenViewers = () => {
    if (!isOwnStory) return;
    setShowViewers(true);
  };

  const handleOpenReactions = () => {
    if (!isOwnStory) return;
    setShowReactions(true);
  };

  const handleOpenGifters = () => {
    if (!isOwnStory) return;
    setShowGifters(true);
  };

  const fetchViewersPage = useCallback(
    async (cursor: string | null) => {
      const result = await storyService.getStoryViewers(currentStory.id, cursor);
      return {
        items: (result?.items ?? []).map((v: any) => ({
          id: v.id,
          username: v.username,
          profilePictureUrl: v.profilePictureUrl,
          profileFrame: v.profileFrame,
          level: v.level,
          timestamp: v.viewedAt,
        })),
        nextCursor: result?.nextCursor ?? null,
      };
    },
    [currentStory.id],
  );

  const fetchReactionsPage = useCallback(
    async (cursor: string | null) => {
      const result = await storyService.getStoryReactions(currentStory.id, cursor);
      return {
        items: (result?.items ?? []).map((r: any) => ({
          id: r.id,
          username: r.username,
          profilePictureUrl: r.profilePictureUrl,
          profileFrame: r.profileFrame,
          level: r.level,
          timestamp: r.reactedAt,
          emoji: r.emoji,
        })),
        nextCursor: result?.nextCursor ?? null,
      };
    },
    [currentStory.id],
  );

  const fetchGiftersPage = useCallback(
    async (cursor: string | null) => {
      const result = await storyService.getStoryGifters(currentStory.id, cursor);
      return {
        items: (result?.items ?? []).map((g: any) => ({
          id: g.id,
          username: g.username,
          profilePictureUrl: g.profilePictureUrl,
          profileFrame: g.profileFrame,
          level: g.level,
          timestamp: g.giftedAt,
          giftLabel: `${g.giftName} · ${g.coinsCost} coins`,
        })),
        nextCursor: result?.nextCursor ?? null,
      };
    },
    [currentStory.id],
  );

  const handleGiftSent = (gift: Gifts) => {
    // Same guard, kept as a second line of defense.
    if (isOwnStory) {
      showError("You can't send a gift to your own story", "Gifting Forbidden");
      return;
    }

    if (coins < gift.coins) {
      showError("Not enough coins", "Gifting Forbidden");
      return;
    }

    const previousCoins = coins;
    const nextBalance = coins - gift.coins;

    // Immediate/optimistic: react to the tap right away — don't make the
    // user wait on the network round-trip before anything shows up.
    setCoins(nextBalance);
    const storyGifts = (giftsCounts[currentStory.id] || 0) + 1;
    setGiftsCounts(prev => ({ ...prev, [currentStory.id]: storyGifts }));

    if (onStoryUpdated) {
      onStoryUpdated(currentStory.id, { giftsCount: storyGifts });
    }

    // Never shown for gifts sent to your own story — there's no one to
    // surprise with the flying-gift animation.
    if (!isOwnStory) {
      globalOverlayRef.current?.show(gift, "You");
    }

    setShowGifts(false);
    setActiveComboGift(gift);

    giftService
      .sendGift({
        giftId: gift?.id as string,
        targetType: GiftTargetType.STORY,
        targetId: currentStory.id,
      })
      .then(() => {
        DeviceEventEmitter.emit("GIFT_TRANSACTION_COMPLETE", {
          newBalance: nextBalance,
        });
      })
      .catch((error: any) => {
        // Roll back the optimistic coin deduction so the balance is never wrong.
        setCoins(previousCoins);
        const message = error?.response?.data?.message || "Failed to deliver gift.";
        showError(message, "Gifting Forbidden");
        Alert.alert("Gifting Forbidden", message);
      });
  };

  const toggleEmojiPicker = (show: boolean) => {
    if (show) {
      setShowEmojiPicker(true);
      Animated.spring(pickerAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    } else {
      Animated.timing(pickerAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setShowEmojiPicker(false));
    }
  };

  const handleNext = () => {
    // Both the animated progress bar and the video's playToEnd event can
    // fire at the end of a video story; only the first one should advance.
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;
    if (advanceLockTimer.current) clearTimeout(advanceLockTimer.current);
    advanceLockTimer.current = setTimeout(() => {
      advanceLockRef.current = false;
    }, 600);

    if (currentIndex < userStories.stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      toggleEmojiPicker(false);
    } else {
      if (onFinish) onFinish();
      else onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      toggleEmojiPicker(false);
    } else if (onPrevious) {
      onPrevious();
    } else {
      progressAnim.setValue(0);
    }
  };

  const handleScreenTouch = (evt: any) => {
    if (showEmojiPicker) {
      toggleEmojiPicker(false);
      return;
    }

    const x = evt.nativeEvent.locationX;
    if (x < SCREEN_WIDTH * 0.3) {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    toggleEmojiPicker(false);

    const storyId = currentStory.id;
    const existingReaction = activeReactionMap[storyId];
    const previousCount = reactionCounts[storyId] || 0;
    const isRemoving = existingReaction === emoji;

    // Reflect the tap immediately — the request happens in the background,
    // and only gets reconciled/rolled back once it settles.
    const optimisticEmoji = isRemoving ? null : emoji;
    const optimisticCount = isRemoving
      ? Math.max(0, previousCount - 1)
      : existingReaction
        ? previousCount
        : previousCount + 1;

    setActiveReactionMap((prev) => ({ ...prev, [storyId]: optimisticEmoji }));
    setReactionCounts((prev) => ({ ...prev, [storyId]: optimisticCount }));

    const request = isRemoving
      ? storyService.unreactFromStory(storyId)
      : storyService.reactToStory(storyId, emoji);

    request
      .then((res) => {
        // Server is the source of truth for the count — correct any drift,
        // but only if the user hasn't already tapped again since (this
        // response is for the emoji we just optimistically applied).
        if (typeof res?.reactionsCount === "number" && activeReactionMapRef.current[storyId] === optimisticEmoji) {
          setReactionCounts((prev) => ({ ...prev, [storyId]: res.reactionsCount }));
        }
      })
      .catch((error) => {
        console.error("Failed to sync story reaction, rolling back:", error);
        setActiveReactionMap((prev) => ({ ...prev, [storyId]: existingReaction ?? null }));
        setReactionCounts((prev) => ({ ...prev, [storyId]: previousCount }));
        showError("Couldn't send your reaction", "Try again");
      });
  };

  const handleBaseHeartPress = () => {
    const storyId = currentStory.id;
    if (activeReactionMap[storyId]) {
      handleSelectEmoji(activeReactionMap[storyId]!);
    } else {
      handleSelectEmoji("❤️");
    }
  };

  const userSelectedEmoji = activeReactionMap[currentStory.id];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        behavior="padding"
        style={styles.container}
      >
        <TouchableWithoutFeedback
          onPressIn={() => {
            pressStartRef.current = Date.now();
            setIsPaused(true);
          }}
          onPressOut={() => setIsPaused(false)}
          onPress={(evt) => {
            if (Date.now() - pressStartRef.current > TAP_MAX_DURATION_MS) {
              // Held long enough to be a pause gesture — resume, don't navigate.
              return;
            }
            handleScreenTouch(evt);
          }}
        >
          <View style={{ flex: 1 }}>
            {/* Story Media Renderer */}
            <View style={styles.mediaContainer}>
              {currentStory.type === "text" && (
                <View
                  style={[
                    styles.storyMedia,
                    styles.textStoryContainer,
                    { backgroundColor: currentStory.backgroundColor || "#7c3aed" },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.storyTextDisplay,
                      { textAlign: (currentStory.textAlign as any) || "center" },
                    ]}
                  >
                    {currentStory.textContent}
                  </ThemedText>
                </View>
              )}

              {currentStory.type === "image" && (
                <Image
                  source={{ uri: currentStory.mediaUrl }}
                  style={styles.storyMedia}
                  resizeMode="cover"
                />
              )}

              {currentStory.type === "video" && currentStory.mediaUrl && (
                <View style={styles.storyMedia}>
                  <VideoStorySegment
                    key={currentStory.id}
                    uri={currentStory.mediaUrl}
                    playing={!shouldPause}
                    onDuration={(millis) =>
                      setVideoDuration((prev) => (prev == null ? millis : prev))
                    }
                    onLoadingChange={setIsVideoLoading}
                    onEnded={handleNext}
                    // With a sound, only the sound plays — the clip's own audio is muted
                    volume={storySound ? 0 : 1}
                  />
                  {isVideoLoading && (
                    <View style={styles.loaderContainer}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                  )}
                </View>
              )}

              {/* Top Navigation Overlay — sits edge-to-edge so the progress
                  bars and header display up into the status bar area */}
              <View style={[styles.topOverlay, { top: insets.top + 8 }]}>
                <View style={styles.progressContainer}>
                  {userStories.stories.map((story, index) => {
                    let barWidth: any = "0%";
                    if (index < currentIndex) {
                      barWidth = "100%";
                    } else if (index === currentIndex) {
                      barWidth = progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      });
                    }

                    return (
                      <View key={story.id} style={styles.progressBarBackground}>
                        <Animated.View
                          style={[styles.progressBarFill, { width: barWidth }]}
                        />
                      </View>
                    );
                  })}
                </View>

                <View style={styles.header}>
                  <ProfileFrame
                    frameId={userStories.profileFrame}
                    uri={userStories.userAvatar}
                    size={38}
                    initial={userStories.userName?.[0]?.toUpperCase()}
                  />
                  <View style={styles.userInfo}>
                    <ThemedText style={styles.userName}>{userStories.userName}</ThemedText>
                    <LevelBadge level={userStories.level}/>
                    <ThemedText style={styles.timeText}>{currentStory.timestamp}</ThemedText>
                    {storySound && (
                      <SoundLabel sound={storySound.sound} onPress={() => setSoundSheetVisible(true)} />
                    )}
                  </View>
                  {(storySound || currentStory.type === "video") && (
                    <TouchableOpacity
                      onPress={toggleMuted}
                      style={styles.closeButton}
                      accessibilityLabel={muted ? "Unmute" : "Mute"}
                    >
                      <MaterialIcons name={muted ? "volume-off" : "volume-up"} size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {!isOwnStory && (
                    <TouchableOpacity
                      onPress={() => setShowReport(true)}
                      style={styles.closeButton}
                      accessibilityLabel="Report story"
                    >
                      <MaterialIcons name="flag" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <MaterialIcons name="close" size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Floating Dynamic Emoji Picker Panel */}
            {showEmojiPicker && (
              <Animated.View 
                style={[
                  styles.emojiPickerContainer,
                  {
                    opacity: pickerAnim,
                    transform: [{
                      translateY: pickerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }]
                  }
                ]}
              >
                {AVAILABLE_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      userSelectedEmoji === emoji && styles.emojiButtonActive
                    ]}
                    onPress={() => handleSelectEmoji(emoji)}
                  >
                    <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            {/* Bottom Controls Overlay */}
            <View style={styles.bottomOverlay}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={isOwnStory ? handleOpenReactions : handleBaseHeartPress}
                onLongPress={isOwnStory ? undefined : () => toggleEmojiPicker(true)}
              >
                {!isOwnStory && userSelectedEmoji ? (
                  <ThemedText style={{ fontSize: 24 }}>{userSelectedEmoji}</ThemedText>
                ) : (
                  <MaterialIcons name="favorite-border" size={28} color="#FFFFFF" />
                )}
                <ThemedText style={styles.actionText}>
                  {formatCount(reactionCounts[currentStory.id] ?? 0)}
                </ThemedText>
              </TouchableOpacity>

              {isOwnStory && (
                <TouchableOpacity
                  style={styles.actionButton}
                  activeOpacity={0.7}
                  onPress={handleOpenViewers}
                >
                  <Eye size={28} color={"#fff"} />
                  <ThemedText style={styles.actionText}>
                    {formatCount(currentStory.viewCount ?? 0)}
                  </ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleOpenGiftPicker}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Gift size={28} color={"#fff"} />
                <ThemedText style={styles.actionText}>
                  {formatCount(giftsCounts[currentStory.id] ?? 0)}
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Modals & Animations */}
            <GiftModal
              visible={showGifts}
              onClose={() => setShowGifts(false)}
              coinBalance={coins}
              onSend={handleGiftSent}
            />

            <ReportContentSheet
              visible={showReport}
              targetType="story"
              targetId={currentStory?.id}
              subject="story"
              onClose={() => setShowReport(false)}
            />

            <SoundInfoSheet
              sound={storySound?.sound ?? null}
              startMs={storySound?.startMs}
              visible={soundSheetVisible}
              onClose={() => setSoundSheetVisible(false)}
              // Leaving for the camera to use this sound: close the viewer
              beforeUse={onClose}
            />

            <StoryPeopleListModal
              visible={showViewers}
              title="Viewed by"
              emptyText="No views yet"
              fetchPage={fetchViewersPage}
              onClose={() => setShowViewers(false)}
            />

            <StoryPeopleListModal
              visible={showReactions}
              title="Reactions"
              emptyText="No reactions yet"
              fetchPage={fetchReactionsPage}
              onClose={() => setShowReactions(false)}
            />

            <StoryPeopleListModal
              visible={showGifters}
              title="Gifted by"
              emptyText="No gifts yet"
              fetchPage={fetchGiftersPage}
              onClose={() => setShowGifters(false)}
            />

            {activeComboGift && (
              <FloatingComboButton
                gift={activeComboGift}
                coinBalance={coins}
                onSend={() => handleGiftSent(activeComboGift)}
                onTimeout={() => setActiveComboGift(null)}
              />
            )}
            <GiftSendOverlay ref={globalOverlayRef} />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  mediaContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  storyMedia: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: "absolute",
  },
  textStoryContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  storyTextDisplay: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 36,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  topOverlay: {
    position: "absolute",
    top: 20, 
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: "row",
    height: 3,
    gap: 4,
    marginBottom: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  timeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  closeButton: {
    padding: 6,
  },
  emojiPickerContainer: {
    position: "absolute",
    bottom: 90,
    left: 16,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    zIndex: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  emojiButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  emojiText: {
    fontSize: 24,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 30, 
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 10,
  },
  actionButton: {
    minWidth: 50,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 4,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});