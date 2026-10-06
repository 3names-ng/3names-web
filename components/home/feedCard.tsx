import { LinearGradient } from "expo-linear-gradient";
import React, { Suspense, useCallback, useEffect, memo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  DeviceEventEmitter,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Gesture-handler's FlatList negotiates nested opposite-axis scrolling (this
// horizontal media pager living inside the vertical feed FlatList) through
// native gesture recognizers, unlike plain RN FlatList/ScrollView — which on
// Android in particular lets the vertical feed win the touch and slide to
// the next post instead of paging the images.
import { FlatList as GestureFlatList } from "react-native-gesture-handler";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { useOptimisticMutation } from "@/hooks/useOptimisticMutation";
import { syncKeys } from "@/store/syncStore";
import getRelativeTime, { formatCount } from "@/service/helper";
import {
  coinService,
  giftService,
  GiftTargetType,
  postService,
} from "@/service/post.service";
import { useAuthStore } from "@/store/authStore";
import {
  Bookmark,
  ChevronRight,
  Edit3,
  EyeOff,
  Gauge,
  Gift,
  Globe,
  Hash,
  Heart,
  Layers,
  MessageCircle,
  Repeat2,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { selectionFrom } from "@/service/sound.service";
import { useSoundPlayback } from "@/hooks/useSoundPlayback";
import { clipSource, prefetchClip } from "@/utils/soundClip";
import { useSoundSettingsStore } from "@/store/soundSettingsStore";
import { SoundDisc, SoundLabel } from "../sound/soundTag";
import SoundInfoSheet from "../sound/soundInfoSheet";
import FilteredVideoPreview from "../camera/filteredVideoPreview";
import FilteredImage from "../camera/filteredImage";
import { FILTER_BY_ID } from "@/constants/cameraFilters";
import { LevelBadge } from "../levelBadge";
import CategorySection from "../post/categorySection";
import CommentsModal from "../post/commentBottomSheet";
import HashtagSection from "../post/hashtagSection";
import PrivacySection from "../post/privacySection";
import { ProfileFrame } from "../ui/ProfileFrame";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { showError, showSuccess } from "../ui/toast";
// The gift stack (picker modal, fly-in overlay, combo button) is only needed
// once the user interacts with gifts, so it's loaded in a separate JS chunk.
// Keeping it out of the startup bundle makes the app open faster.
import type { Gifts } from "@/components/gift/GiftGridItem";
import { userService } from "@/service/profile.Service";
import { router } from "expo-router";
import GiftModal from "../gift/GiftModal";
import type { GiftSendOverlayRef } from "../gift/GiftSendOverlay";
import GiftSendOverlay from "../gift/GiftSendOverlay";
import FloatingComboButton from "../gift/floatingComboButton";
import StoryPeopleListModal from "../story/storyPeopleListModal";
import {
  resolveTextPostFontSize,
  resolveTextPostFontStyle,
  type TextPostSlide,
} from "../post/textPostStyles";
import VideoPlayerItem from "./videoPlayerItem";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MEDIA_WIDTH = SCREEN_WIDTH;
const MEDIA_HEIGHT = SCREEN_HEIGHT;
const FEED_TAB_OFFSET = 60;
// Room reserved at the bottom of the caption block for the video's control
// strip (time, seek bar, settings, fullscreen), so it never sits on top of the
// caption / user header.
const SEEK_BAR_SPACE = 32;
// Playback speeds offered for videos in the long-press options sheet.
const PLAYBACK_SPEEDS = [1, 1.5, 2, 2.5];

/**
 * Videos get the seekable duration meter; everything else is a still image.
 * Kept as one helper so the carousel and the meter space reservation can't
 * drift apart.
 */
function isVideoMedia(item: any) {
  return (
    item?.type === "video" ||
    item?.url?.endsWith(".mp4") ||
    item?.mimeType?.startsWith("video/") ||
    item?.url?.endsWith(".mov") ||
    item?.url?.endsWith(".mkv") ||
    item?.url?.endsWith(".webM") ||
    item?.url?.endsWith(".avi")
  );
}

type MenuViewType =
  | "MAIN"
  | "REPORT"
  | "HIDE_CONFIRM"
  | "DELETE_CONFIRM"
  | "EDIT_CAPTION"
  | "EDIT_HASHTAGS"
  | "EDIT_CATEGORY"
  | "EDIT_VISIBILITY"
  | "EDIT_PLAYBACK_SPEED"
  | "EDIT_COMMENT_PERMISSIONS"
  | "EDIT_GIFTS_PERMISSIONS"
  | "EDIT_STATUS";

export enum CommentPermission {
  EVERYONE = "everyone",
  FOLLOWERS_ONLY = "followers_only",
  NOBODY = "nobody",
}

export enum PostVisibility {
  PUBLIC = "public",
  FOLLOWERS = "followers",
  PRIVATE = "private",
}

export enum PostStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

interface FeedCardProps {
  post: any;
  onPostHidden?: (postId: string) => void;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (postId: string, updatedFields: any) => void;
  isParentActive?: any;
  isFirst?: boolean;
}

function FeedCard({
  post,
  onPostHidden,
  onPostDeleted,
  onPostUpdated,
  isParentActive,
  isFirst = false,
}: FeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  // Speed of this post's video (1x unless changed from the options sheet).
  const [playbackRate, setPlaybackRate] = useState(1);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const mediaItems = post.media || [];
  // A post with any video reserves the strip under the caption for the meter.
  const hasVideo = mediaItems.some(isVideoMedia);

  // Sound (TikTok-style): plays while this post is on screen, over photos,
  // videos or text. Null if the post has none or it was taken down.
  const soundSelection = React.useMemo(() => selectionFrom(post), [post]);
  const soundActive = !!soundSelection && !!isParentActive && !menuVisible;
  // On a video, the sound pauses when the user pauses the video and resumes
  // from the same spot. It starts straight away — it doesn't wait for the
  // video to load (null = the video hasn't reported playing/paused yet).
  const [activeVideoPlaying, setActiveVideoPlaying] = useState<boolean | null>(null);
  const activeItem = mediaItems[activeMediaIndex];
  const followsVideo = !!activeItem && isVideoMedia(activeItem) && !activeItem.filterId;
  useEffect(() => {
    // New post on screen or another carousel item: wait for its own report
    setActiveVideoPlaying(null);
  }, [isParentActive, activeMediaIndex]);
  useSoundPlayback(soundSelection, soundActive, {
    paused: followsVideo && activeVideoPlaying === false,
  });
  // Download the clip while the post is nearby, so it plays instantly on screen
  useEffect(() => {
    if (soundSelection) void prefetchClip(clipSource(soundSelection));
  }, [soundSelection]);
  const muted = useSoundSettingsStore((s) => s.muted);
  const toggleMuted = useSoundSettingsStore((s) => s.toggleMuted);
  const [soundSheetVisible, setSoundSheetVisible] = useState(false);

  // A text post can carry several slides (a swipeable carousel, same idea as
  // multiple media items on a media post). Only meaningful when there's no
  // media — a post is either a media carousel or a text carousel, never both.
  const [activeTextSlideIndex, setActiveTextSlideIndex] = useState(0);
  const textSlides: TextPostSlide[] | null =
    mediaItems.length === 0 && Array.isArray(post.textSlides) && post.textSlides.length > 0
      ? post.textSlides
      : null;
  const hasMultipleTextSlides = !!textSlides && textSlides.length > 1;

  // Horizontal media pager (only when multiple media items): a native paged
  // FlatList owns the swipe gesture — the previous JS PanResponder lost the
  // gesture negotiation against the video's full-screen Pressable and the
  // parent vertical feed scroll, so horizontal swipes were frequently dropped.
  // We only track which page is visible so videos play/pause and the
  // pagination dots stay in sync.
  const mediaViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;
  const onMediaViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first && first.index != null) {
        setActiveMediaIndex(first.index);
      }
    },
  ).current;
  const onTextSlideViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first && first.index != null) {
        setActiveTextSlideIndex(first.index);
      }
    },
  ).current;
  const user = useAuthStore((state) => state.user);
  const currentUserId = user?.id;
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [menuView, setMenuView] = useState<MenuViewType>("MAIN");
  const [reportReason, setReportReason] = useState("");

  const [editDescription, setEditDescription] = useState(
    post.description || "",
  );
  const [editGiftsEnabled, setEditGiftsEnabled] = useState<boolean>(
    post.giftsEnabled ?? true,
  );
  const [editCategory, setEditCategory] = useState(post.category || "");
  const [editHashtagsText, setEditHashtagsText] = useState<string[]>(
    post.hashtags || [],
  );

  const [isLiked, setIsLiked] = useState<boolean>(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [isLikeMutating, setIsLikeMutating] = useState<boolean>(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Double-tap to like
  const lastTapRef = useRef<number>(0);
  const doubleTapHeartAnim = useRef(new Animated.Value(0)).current;
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);

  const handleDoubleTap = () => {
    if (isLiked || isLikeMutating) return;
    handleLikePress();
    // Show heart animation
    setShowDoubleTapHeart(true);
    doubleTapHeartAnim.setValue(0);
    Animated.sequence([
      Animated.spring(doubleTapHeartAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.delay(600),
      Animated.timing(doubleTapHeartAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setShowDoubleTapHeart(false));
  };

  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      handleDoubleTap();
    }
    lastTapRef.current = now;
  };

  const [audience, setAudience] = useState<
    "public" | "friends" | "school_only"
  >(post.visibility || "public");
  const [commentPrivacy, setCommentPrivacy] = useState<"everyone" | "nobody">(
    post.commentPermission || "everyone",
  );

  const { isDark, colors } = useTheme();
  const colorScheme = isDark ? "dark" : "light";
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const iconColor = isDark ? "#ffffff" : "#111111";
  const captionText = post.description || "";
  const timeFormatted = getRelativeTime(post.createdAt);

  const renderMediaItem = (item: any, index: number) => {
    const isVideo = isVideoMedia(item);
    const hasMultipleMedia = mediaItems.length > 1;

    const mediaBadge = hasMultipleMedia ? (
      <View style={styles.mediaItemBadge} pointerEvents="none">
        <Text style={styles.mediaItemBadgeText}>
          {index + 1}/{mediaItems.length}
        </Text>
      </View>
    ) : null;

    // Your own just-posted video, still the raw local file: play it with its
    // camera filter until the server's filtered copy replaces it
    const localFilter = isVideo && item.filterId ? FILTER_BY_ID[item.filterId] : undefined;
    if (localFilter) {
      return (
        <View
          key={item.id || `media-${index}`}
          style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT, backgroundColor: "#000" }}
        >
          <FilteredVideoPreview
            uri={item.url}
            filter={localFilter.params}
            paused={!(index === activeMediaIndex && isParentActive && !menuVisible)}
            muted={!!soundSelection || muted}
          />
          {mediaBadge}
        </View>
      );
    }

    if (isVideo) {
      return (
        <View
          key={item.id || `media-${index}`}
          style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT }}
        >
          <VideoPlayerItem
            videoUrl={item.url}
            // The options sheet pauses the video while it is open (like the
            // story viewer); it resumes at the chosen speed on close.
            isActive={
              index === activeMediaIndex && isParentActive && !menuVisible
            }
            width={MEDIA_WIDTH}
            height={MEDIA_HEIGHT}
            contentFit="contain"
            playbackRate={playbackRate}
            // A post with a sound plays only the sound — the video's own audio is muted
            volume={soundSelection ? 0 : 1}
            onLongPress={() => setMenuVisible(true)}
            onSettingsPress={() => setMenuVisible(true)}
            // Sit in the gap reserved under the caption, above the tab bar.
            controlsBottomOffset={insets.bottom + FEED_TAB_OFFSET}
            // Pausing the video pauses the post's sound too
            onPlayingChange={(playing) => {
              if (index === activeMediaIndex) setActiveVideoPlaying(playing);
            }}
          />
          {mediaBadge}
        </View>
      );
    }

    return (
      <View
        key={item.id || `media-${index}`}
        style={{
          width: MEDIA_WIDTH,
          height: MEDIA_HEIGHT,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {item.filterId && FILTER_BY_ID[item.filterId] ? (
          // Your just-posted photo (raw local file) — shown filtered until the server copy arrives
          <FilteredImage
            uri={item.url}
            filter={FILTER_BY_ID[item.filterId].params}
            style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT }}
          />
        ) : (
          <Image
            source={{ uri: item.url }}
            style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT }}
            resizeMode="contain"
          />
        )}
        {mediaBadge}
      </View>
    );
  };
  // const isOwnPost = post.userId === currentUserId;
  const postAuthorId = post?.user?.id || post?.userId;
  const isOwnPost = Boolean(
    currentUserId && postAuthorId && currentUserId === postAuthorId,
  );
  const handleLikePress = async () => {
    if (isLikeMutating) return;
    setIsLikeMutating(true);

    const previouslyLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previouslyLiked);
    setLikesCount((prev) => (previouslyLiked ? prev - 1 : prev + 1));

    try {
      if (previouslyLiked) {
        await postService.unlikePost(post.id);
      } else {
        await postService.likePost(post.id);
      }
    } catch (error) {
      console.error("Failed to update post like status:", error);
      setIsLiked(previouslyLiked);
      setLikesCount(previousCount);
    } finally {
      setIsLikeMutating(false);
    }
  };

  const [balance, setBalance] = useState<number>(0);

  const fetchBalance = async () => {
    try {
      const response = await coinService.getBalance();
      const currentBalance =
        typeof response?.balance === "number" ? response.balance : response;

      setBalance(currentBalance);
      setCoins(currentBalance);
    } catch (error) {
      console.error("Error fetching live coin balance:", error);
    }
  };
  useEffect(() => {
    fetchBalance();
  }, []);

  // Edits apply to the feed and the local mirror states immediately, then sync
  // in the background. On failure the previous values are restored and the
  // parent feed is told, so the card never shows a change the server rejected.
  const fieldUpdateMutation = useOptimisticMutation<
    any,
    {
      payload: Record<string, any>;
      successMessage: string;
      previous: Record<string, any>;
    }
  >({
    apply: ({ payload, successMessage }) => {
      if (onPostUpdated) onPostUpdated(post.id, payload);
      if ("visibility" in payload) setAudience(payload.visibility);
      if ("commentPermission" in payload)
        setCommentPrivacy(payload.commentPermission);
      if ("giftsEnabled" in payload) setEditGiftsEnabled(payload.giftsEnabled);
      if ("hashtags" in payload) setEditHashtagsText(payload.hashtags);
      if ("category" in payload) setEditCategory(payload.category);
      if ("description" in payload) setEditDescription(payload.description);
      setMenuVisible(false);
      setMenuView("MAIN");
      showSuccess(successMessage, "Success");
    },
    rollback: ({ previous }) => {
      if (onPostUpdated) onPostUpdated(post.id, previous);
      if ("visibility" in previous) setAudience(previous.visibility);
      if ("commentPermission" in previous)
        setCommentPrivacy(previous.commentPermission);
      if ("giftsEnabled" in previous)
        setEditGiftsEnabled(previous.giftsEnabled);
      if ("hashtags" in previous) setEditHashtagsText(previous.hashtags);
      if ("category" in previous) setEditCategory(previous.category);
      if ("description" in previous) setEditDescription(previous.description);
      showError("Couldn't save your changes. Please try again.", "Error");
    },
    request: ({ payload }) => postService.updatePost(post.id, payload),
  });

  const handleFieldUpdate = (
    payload: Record<string, any>,
    successMessage: string,
  ) => {
    if (isUpdating) return;

    // Snapshot the fields being changed before the optimistic apply — reading
    // them later would return the already-updated values.
    const previous: Record<string, any> = {};
    if ("visibility" in payload) previous.visibility = post.visibility;
    if ("commentPermission" in payload)
      previous.commentPermission = post.commentPermission;
    if ("giftsEnabled" in payload) previous.giftsEnabled = post.giftsEnabled;
    if ("hashtags" in payload) previous.hashtags = post.hashtags;
    if ("category" in payload) previous.category = post.category;
    if ("description" in payload) previous.description = post.description;

    setIsUpdating(true);
    fieldUpdateMutation
      .run({ payload, successMessage, previous })
      .finally(() => setIsUpdating(false));
  };

  const closeMenuReset = () => {
    if (isReporting || isHiding || isDeleting || isUpdating) return;
    setMenuVisible(false);
    setMenuView("MAIN");
    setReportReason("");
  };

  // Long-press sheet > playback speed. Applying a speed also resumes the
  // video (see VideoPlayerItem) so the choice takes effect right away.
  const handlePlaybackSpeedSelect = (speed: number) => {
    setPlaybackRate(speed);
    closeMenuReset();
  };

  const handleCancelEdit = () => {
    setMenuView("MAIN");
    setEditDescription(post.description || "");
    setEditHashtagsText(post.hashtags || []);
    setEditCategory(post.category || "");
    setAudience(post.visibility || PostVisibility.PUBLIC);
    setCommentPrivacy(post.commentPermission || CommentPermission.EVERYONE);
    setEditGiftsEnabled(post.giftsEnabled ?? true);
  };

  const handleAddHashtag = (newTag: string) => {
    const cleanTag = newTag.replace(/#/g, "").trim();
    if (!cleanTag) return;
    setEditHashtagsText((prev) =>
      prev.includes(cleanTag) ? prev : [...prev, cleanTag],
    );
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setEditHashtagsText((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleHashtagsSave = () => {
    const cleanHashtags = editHashtagsText
      .map((tag) => tag.replace(/#/g, "").trim())
      .filter((tag) => tag.length > 0);

    handleFieldUpdate(
      { hashtags: cleanHashtags },
      "Hashtags updated successfully",
    );
  };

  const handleReportSubmit = async () => {
    if (!reportReason.trim() || isReporting) return;
    setIsReporting(true);
    try {
      await postService.reportPosts(post.id, reportReason.trim());
      showSuccess(t("feedCard.postReported"), "Success");
      closeMenuReset();
    } catch (error) {
      console.error("Failed to report post:", error);
    } finally {
      setIsReporting(false);
    }
  };

  const handleHideConfirm = async () => {
    if (isHiding) return;
    setIsHiding(true);
    try {
      await postService.hidePost(post.id);
      showSuccess(t("feedCard.postHidden"), "Success");
      closeMenuReset();
      if (onPostHidden) onPostHidden(post.id);
    } catch (error) {
      console.error("Failed to hide post:", error);
    } finally {
      setIsHiding(false);
    }
  };

  // Removing the card is immediate; the request runs in the background. If it
  // fails, invalidateKeys makes the feed refetch authoritative data so the post
  // reappears instead of silently vanishing.
  const deletePostMutation = useOptimisticMutation<any, { id: string }>({
    apply: ({ id }) => {
      if (onPostDeleted) onPostDeleted(id);
      setMenuVisible(false);
      setMenuView("MAIN");
      showSuccess(t("feedCard.postDeleted"), "Success");
    },
    rollback: () => {
      showError("Couldn't delete the post. Please try again.", "Error");
    },
    request: ({ id }) => postService.deletePost(id),
    invalidateKeys: [syncKeys.posts],
  });

  const handleDeleteConfirm = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    deletePostMutation.run({ id: post.id }).finally(() => setIsDeleting(false));
  };

  const [showGifts, setShowGifts] = useState(false);
  const [coins, setCoins] = useState(balance);

  const globalOverlayRef = useRef<GiftSendOverlayRef | null>(null);

  const [activeComboGift, setActiveComboGift] = useState<Gifts | null>(null);

  // Gifters list (owner only) — the modal fetches and paginates its own data
  const [showGifters, setShowGifters] = useState(false);

  const handleOpenGifters = () => {
    if (!isOwnPost) return;
    setShowGifters(true);
  };

  const fetchGiftersPage = useCallback(
    async (cursor: string | null) => {
      const result = await postService.getPostGifters(post.id, cursor);
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
    [post.id],
  );

  // On your own post, the gift icon shows who has gifted it instead of
  // opening the picker — you can't send a gift to yourself.
  const handleOpenGiftPicker = () => {
    if (isOwnPost) {
      handleOpenGifters();
      return;
    }
    setShowGifts(true);
  };

  const handleGiftSent = (gift: Gifts, comboCount: number = 1) => {
    // Same guard, kept as a second line of defense in case this is ever
    // reached another way (e.g. the floating combo button re-opening it).
    if (isOwnPost) {
      showError("You can't send a gift to your own post", t("feedCard.giftForbidden"));
      return;
    }

    // Not enough coins — never let the balance go negative. The combo button
    // is disabled in this state; this guard catches double-taps. Surface it
    // instead of silently no-opping, or the same gift's Send button looks
    // dead until a cheaper one is picked.
    if (coins < gift.coins) {
      showError("Not enough coins", t("feedCard.giftForbidden"));
      return;
    }

    // Deduct coins OPTIMISTICALLY, before the network round-trip, so the
    // combo button disables the moment the balance is exhausted (otherwise
    // the stale balance would let one extra tap through while awaiting).
    const nextBalance = coins - gift.coins;
    setCoins(nextBalance);

    // Close the picker / hand off to the floating combo button immediately —
    // don't make the tap wait on a network round-trip before anything on
    // screen reacts. The network call fires in the background below.
    // The flying-gift video is NOT played on each combo tap — it plays once
    // after the user stops clicking (see handleComboTimeout).
    setShowGifts(false);
    setActiveComboGift(gift);

    giftService
      .sendGift({
        giftId: gift?.id as string,
        targetType: GiftTargetType.POST,
        targetId: post?.id,
        comboCount,
      })
      .then(() => {
        if (onPostUpdated) {
          onPostUpdated(post.id, {
            giftsCount: (post.giftsCount ?? 0) + 1,
          });
        }

        DeviceEventEmitter.emit("GIFT_TRANSACTION_COMPLETE", {
          newBalance: nextBalance,
        });
      })
      .catch((error: any) => {
        // Roll back the optimistic deduction so the balance is never wrong.
        setCoins(coins);
        const message =
          error?.response?.data?.message || "Failed to deliver gift.";
        showError(message, t("feedCard.giftForbidden"));
        console.log("gift err", error);
      });
  };

  // Once the combo window expires, play the gift video once, showing the
  // total number of gifts sent during the combo. Never shown for gifts sent
  // to your own post — there's no one to "surprise" with the animation.
  const handleComboTimeout = (count: number) => {
    const gift = activeComboGift;
    setActiveComboGift(null);
    if (gift && !isOwnPost) {
      globalOverlayRef.current?.show(gift, "You", count);
    }
  };

  // Local state for optimistic updates
  const [isFavorited, setIsFavorited] = useState(post?.isFavorited ?? false);
  const [favoritesCount, setFavoritesCount] = useState(
    post?.favoritesCount ?? 0,
  );

  const [isReshared, setIsReshared] = useState(post?.isReshared ?? false);
  const [resharesCount, setResharesCount] = useState(post?.resharesCount ?? 0);

  // 🔄 Handle Reshare / Repost
  const handleReshare = async () => {
    // Prevent double reshare if backend doesn't support undoing reshares via same endpoint
    if (isReshared) return;

    // Optimistic UI Update
    setIsReshared(true);
    setResharesCount((prev: any) => prev + 1);

    try {
      await postService.resharePost(post.id);
    } catch (error) {
      // Rollback on error
      setIsReshared(false);
      setResharesCount((prev: any) => prev - 1);
      showError(t("feedCard.reshareError"), "Error");
    }
  };

  // 🔖 Handle Favorite / Bookmark Toggle
  const handleToggleFavorite = async () => {
    const previousState = isFavorited;
    const previousCount = favoritesCount;

    // Optimistic UI Update
    setIsFavorited(!previousState);
    setFavoritesCount((prev: any) => (previousState ? prev - 1 : prev + 1));

    try {
      if (previousState) {
        await postService.removeFavorite(post.id);
      } else {
        await postService.addFavorite(post.id);
      }
    } catch (error) {
      // Rollback on error
      setIsFavorited(previousState);
      setFavoritesCount(previousCount);
      showError(t("feedCard.favoritesError"), "Error");
    }
  };

  // Place inside FeedCard component with other state declarations
  // Extract with fallbacks
  const initialIsFollowing =
    post?.user?.isFollowing ?? post?.isFollowing ?? false;

  const [isFollowing, setIsFollowing] = useState<boolean>(initialIsFollowing);

  useEffect(() => {
    setIsFollowing(post?.user?.isFollowing ?? post?.isFollowing ?? false);
  }, [post?.user?.isFollowing, post?.isFollowing]);

  const [isFollowMutating, setIsFollowMutating] = useState<boolean>(false);

  const handleFollowPress = async () => {
    if (isFollowMutating || !post?.user.id) return;
    setIsFollowMutating(true);

    const previousState = isFollowing;
    const nextState = !previousState;

    // Optimistic local update
    setIsFollowing(nextState);

    // Broadcast to other components immediately
    DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
      userId: post?.user?.id,
      isFollowing: nextState,
    });

    try {
      if (previousState) {
        await userService.unfollowUser(post?.user?.id);
      } else {
        await userService.followUser(post?.user?.id);
      }
    } catch (error) {
      console.error("Failed to update follow status:", error);

      // Rollback local state & notify other components of rollback
      setIsFollowing(previousState);
      DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
        userId: post.user.id,
        isFollowing: previousState,
      });

      showError(t("feedCard.followError"), "Error");
    } finally {
      setIsFollowMutating(false);
    }
  };
  const handleUserPress = () => {
    const postAuthorId = post?.user?.id || post?.userId;

    if (!postAuthorId) {
      console.warn("User press ignored: missing author ID");
      return;
    }

    if (isOwnPost) {
      router.navigate("/profile");
    } else {
      // Extract or pass the nested user object directly
      const userPayload = post?.user || { id: postAuthorId };

      router.push({
        pathname: "/(features)/userProfile/[id]",
        params: {
          id: postAuthorId,
          user: JSON.stringify(userPayload),
          post: JSON.stringify(post),
        },
      });
    }
  };

  useEffect(() => {
    const targetUserId = post?.user?.id || postAuthorId;
    if (!targetUserId) return;

    const subscription = DeviceEventEmitter.addListener(
      "USER_FOLLOW_TOGGLED",
      (event: { userId: string; isFollowing: boolean }) => {
        if (event.userId === targetUserId) {
          setIsFollowing(event.isFollowing);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [post?.user?.id, postAuthorId]);

  return (
    <View
      style={[
        styles.card,
        mediaItems.length === 0 && !hasMultipleTextSlides && {
          // Text posts have no media backdrop: paint the card with the
          // author's chosen text-post color (fallback: dark, like story text).
          // (A multi-slide carousel paints its own background per page instead.)
          backgroundColor: post.backgroundColor || "#0e0e14",
        },
      ]}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={handlePress}
        onLongPress={() => setMenuVisible(true)}
        delayLongPress={350}
        onStartShouldSetResponder={() => false}
        onMoveShouldSetResponder={() => false}
      >
        {/* MEDIA LAYER (fills the entire card) */}
        {mediaItems.length === 1 ? (
          // Single media item: render it directly instead of inside a
          // horizontal FlatList, so there's no scroll-view gesture recognizer
          // to steal the swipe before it can reach the tab-switch responder.
          renderMediaItem(mediaItems[0], 0)
        ) : mediaItems.length > 1 ? (
          // Multiple media items: native paged horizontal list — real swiping
          // with slide feedback, and adjacent items stay warm so swipes land
          // on already-rendered pages.
          <GestureFlatList
            data={mediaItems}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            keyExtractor={(item: any, index: number) =>
              item.id || `media-${index}`
            }
            getItemLayout={(_, index) => ({
              length: MEDIA_WIDTH,
              offset: MEDIA_WIDTH * index,
              index,
            })}
            viewabilityConfig={mediaViewabilityConfig}
            onViewableItemsChanged={onMediaViewableItemsChanged}
            showsHorizontalScrollIndicator={false}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT }}
            renderItem={({ item, index }) => renderMediaItem(item, index)}
          />
        ) : hasMultipleTextSlides ? (
          // Multiple text slides: same native paged carousel as multi-media,
          // one full-bleed styled card per slide.
          <GestureFlatList
            data={textSlides!}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            keyExtractor={(item: TextPostSlide, index: number) =>
              item.id || `text-slide-${index}`
            }
            getItemLayout={(_, index) => ({
              length: MEDIA_WIDTH,
              offset: MEDIA_WIDTH * index,
              index,
            })}
            viewabilityConfig={mediaViewabilityConfig}
            onViewableItemsChanged={onTextSlideViewableItemsChanged}
            showsHorizontalScrollIndicator={false}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT }}
            renderItem={({ item, index }: { item: TextPostSlide; index: number }) => (
              <View
                pointerEvents="none"
                style={[
                  styles.textPostHero,
                  {
                    position: "relative",
                    width: MEDIA_WIDTH,
                    height: MEDIA_HEIGHT,
                    backgroundColor: item.backgroundColor || "#0e0e14",
                    paddingTop: insets.top + 30,
                    paddingBottom: insets.bottom + FEED_TAB_OFFSET + 150,
                  },
                ]}
              >
                <Text
                  numberOfLines={12}
                  adjustsFontSizeToFit
                  minimumFontScale={0.4}
                  style={[
                    styles.textPostHeroText,
                    resolveTextPostFontStyle(item.fontStyle),
                    {
                      fontSize: resolveTextPostFontSize(item.fontSize),
                      lineHeight: Math.round(
                        resolveTextPostFontSize(item.fontSize) * 1.3,
                      ),
                      textAlign: item.textAlign || "center",
                    },
                  ]}
                >
                  {(item.text || "").trim()}
                </Text>

                {/* Same "current/total" badge a multi-media post shows */}
                <View style={styles.mediaItemBadge} pointerEvents="none">
                  <Text style={styles.mediaItemBadgeText}>
                    {index + 1}/{textSlides!.length}
                  </Text>
                </View>
              </View>
            )}
          />
        ) : null}

        {/* Pagination dots UI (Shows only if multiple assets exist) */}
        {(mediaItems.length > 1 || hasMultipleTextSlides) && (
          <View
            style={[styles.paginationDots, { bottom: insets.bottom + 20 }]}
            pointerEvents="none"
          >
            {(mediaItems.length > 1 ? mediaItems : textSlides!).map(
              (_: any, idx: number) => (
                <View
                  key={idx}
                  className={`h-2 rounded-full ${
                    idx === (mediaItems.length > 1 ? activeMediaIndex : activeTextSlideIndex)
                      ? "w-4 bg-violet-600"
                      : "w-2 bg-white/60"
                  }`}
                />
              ),
            )}
          </View>
        )}

        {/* Double-tap heart animation overlay */}
        {showDoubleTapHeart && (
          <Animated.View
            style={[
              styles.doubleTapHeartOverlay,
              {
                opacity: doubleTapHeartAnim,
                transform: [
                  {
                    scale: doubleTapHeartAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
            pointerEvents="none"
          >
            <Heart size={100} color="#FE2C55" fill="#FE2C55" />
          </Animated.View>
        )}

        {/* TEXT-ONLY HERO: media-less posts render their caption as big,
          centered story-style text (with the author's chosen font/size)
          instead of a small caption pinned to the bottom. Skipped when the
          post has its own multi-slide carousel above (hasMultipleTextSlides). */}
        {mediaItems.length === 0 && !hasMultipleTextSlides && captionText.trim().length > 0 && (
          <View
            pointerEvents="none"
            style={[
              styles.textPostHero,
              {
                paddingTop: insets.top + 30,
                paddingBottom: insets.bottom + FEED_TAB_OFFSET + 150,
              },
            ]}
          >
            <Text
              numberOfLines={12}
              adjustsFontSizeToFit
              minimumFontScale={0.4}
              style={[
                styles.textPostHeroText,
                resolveTextPostFontStyle(post.fontStyle),
                {
                  fontSize: resolveTextPostFontSize(post.fontSize),
                  lineHeight: Math.round(
                    resolveTextPostFontSize(post.fontSize) * 1.3,
                  ),
                  textAlign: (post.textAlign as any) || "center",
                },
              ]}
            >
              {captionText.trim()}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.75)"]}
          style={[
            styles.bottomOverlay,
            {
              paddingBottom:
                insets.bottom +
                FEED_TAB_OFFSET +
                // Videos carry the duration meter in this gap.
                (hasVideo ? SEEK_BAR_SPACE : 0),
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={[styles.bottomRow]} pointerEvents="box-none">
            {/* LEFT: USER HEADER, CAPTION & HASHTAGS */}
            <View style={styles.bottomLeftColumn} pointerEvents="box-none">
              {/* USER HEADER */}
              <View style={styles.headerRow} pointerEvents="box-none">
                <Pressable
                  onPress={handleUserPress}
                  style={styles.headerUserInfo}
                >
                  <ProfileFrame
                    frameId={post?.user?.profileFrame}
                    uri={post?.user?.profilePictureUrl}
                    size={44}
                    initial={post?.user?.username?.[0]?.toUpperCase()}
                    fallbackColor="rgba(255,255,255,0.5)"
                  />
                  <View style={styles.headerTextGroup}>
                    <View style={styles.usernameRow}>
                      <Text numberOfLines={1} style={styles.usernameText}>
                        {post?.user?.username}
                      </Text>
                      {/* QUICK FOLLOW BUTTON */}
                    </View>

                    <LevelBadge level={post?.user?.appLevel} />

                    <Text style={styles.timeText}>{timeFormatted}</Text>
                  </View>
                </Pressable>
              </View>

              {/* CAPTION — hidden for text-only posts (shown as the hero) */}
              {mediaItems.length > 0 && captionText.length > 0 && (
                <Text
                  style={[
                    styles.captionText,
                    mediaItems.length === 0 &&
                      post.textAlign && {
                        textAlign: post.textAlign,
                      },
                  ]}
                  numberOfLines={expanded ? undefined : 2}
                >
                  {captionText}
                </Text>
              )}

              {/* MORE / LESS BUTTON */}
              {mediaItems.length > 0 && captionText.length > 120 && (
                <Pressable onPress={() => setExpanded(!expanded)}>
                  <Text style={styles.moreLessText}>
                    {expanded ? t("feedCard.less") : t("feedCard.more")}
                  </Text>
                </Pressable>
              )}

              {/* HASHTAGS */}
              {mediaItems.length > 0 &&
                post.hashtags &&
                post.hashtags.length > 0 && (
                  <Text style={styles.hashtagText}>
                    {post.hashtags.map((h: string) => `#${h} `)}
                  </Text>
                )}

              {/* SOUND */}
              {soundSelection && (
                <SoundLabel sound={soundSelection.sound} onPress={() => setSoundSheetVisible(true)} />
              )}
            </View>
          </View>
        </LinearGradient>

        {/* RIGHT: ACTION COLUMN — vertically centered on the post (outside the
            bottom gradient) so it never covers the user header / caption */}
        <View
          style={[
            styles.actionColumnWrapper,
            { bottom: insets.bottom + FEED_TAB_OFFSET },
          ]}
          pointerEvents="box-none"
        >
            <View style={styles.rightActionColumn}>
              {!isOwnPost && (
                <Pressable
                  style={[
                    styles.followPill,
                    isFollowing && styles.followingPill,
                  ]}
                  onPress={handleFollowPress}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck size={28} color="#fff" />
                      {/* <Text style={styles.followPillText}>Following</Text> */}
                    </>
                  ) : (
                    <>
                      <UserPlus size={28} color="#fff" />
                      {/* <Text style={styles.followPillText}>Follow</Text> */}
                    </>
                  )}
                </Pressable>
              )}
              <Pressable
                onPress={handleLikePress}
                style={styles.actionItem}
                hitSlop={8}
              >
                <Heart
                  size={28}
                  color={isLiked ? "#ef4444" : "#fff"}
                  fill={isLiked ? "#ef4444" : "transparent"}
                />
                <Text style={styles.actionCount}>
                  {formatCount(likesCount)}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={() => setCommentsVisible(true)}
              >
                <MessageCircle size={28} color="#fff" />
                <Text style={styles.actionCount}>
                  {formatCount(commentsCount)}
                </Text>
              </Pressable>

              <Pressable style={styles.actionItem} onPress={handleReshare}>
                <Repeat2 size={28} color={isReshared ? "#10B981" : "#fff"} />
                <Text style={styles.actionCount}>{resharesCount}</Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={handleOpenGiftPicker}
              >
                <Gift size={28} color="#fff" />
                <Text style={styles.actionCount}>
                  {formatCount(post.giftsCount ?? 0)}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionItem}
                onPress={handleToggleFavorite}
              >
                <Bookmark
                  size={28}
                  color={isFavorited ? "#F59E0B" : "#fff"}
                  fill={isFavorited ? "#F59E0B" : "none"}
                />
                {favoritesCount > 0 && (
                  <Text style={styles.actionCount}>{favoritesCount}</Text>
                )}
              </Pressable>

              {/* Mute — applies to every post and story (sounds and video audio) */}
              {(soundSelection || hasVideo) && (
                <Pressable style={styles.actionItem} onPress={toggleMuted} hitSlop={8}>
                  {muted ? <VolumeX size={26} color="#fff" /> : <Volume2 size={26} color="#fff" />}
                </Pressable>
              )}

              {soundSelection && (
                <View style={styles.actionItem}>
                  <SoundDisc
                    sound={soundSelection.sound}
                    spinning={soundActive && !muted}
                    onPress={() => setSoundSheetVisible(true)}
                  />
                </View>
              )}
            </View>
        </View>

        <SoundInfoSheet
          sound={soundSelection?.sound ?? null}
          startMs={soundSelection?.startMs}
          visible={soundSheetVisible}
          onClose={() => setSoundSheetVisible(false)}
        />

        <CommentsModal
          visible={commentsVisible}
          postId={post.id}
          commentPermission={post.commentPermission}
          commentsCount={commentsCount}
          likesCount={likesCount}
          viewsCount={post.viewsCount}
          isOwnPost={isOwnPost}
          onClose={() => setCommentsVisible(false)}
          onCommentCountChange={(newCount) => setCommentsCount(newCount)}
        />

        <Suspense fallback={null}>
          <GiftModal
            visible={showGifts}
            onClose={() => setShowGifts(false)}
            coinBalance={coins}
            onSend={handleGiftSent}
          />
        </Suspense>

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
            onSend={(count) => handleGiftSent(activeComboGift, count)}
            onTimeout={handleComboTimeout}
            onLocked={() => setShowGifts(true)}
          />
        )}
        <GiftSendOverlay ref={globalOverlayRef} />
        {/* CONTEXT OPTIONS DIALOG / MODAL */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="slide"
          onRequestClose={closeMenuReset}
        >
          <TouchableWithoutFeedback onPress={closeMenuReset}>
            <KeyboardAvoidingView
              behavior="padding"
              className="flex-1 justify-end"
              style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            >
              <TouchableWithoutFeedback>
                <ThemedView
                  style={{ backgroundColor: colors.background }}
                  className="rounded-t-3xl bg-white p-4 max-h-[85%] dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800"
                >
                  <ThemedView className="mx-auto mb-3 h-1 w-10 rounded-full dark:bg-neutral-700 bg-transparent" />

                  {/* --- MAIN ROOT OPTION SHEET --- */}
                  {menuView === "MAIN" && (
                    <ScrollView
                      className="pb-8"
                      showsVerticalScrollIndicator={false}
                    >
                      {isOwnPost && (
                        <>
                          <Pressable
                            onPress={() => setMenuView("EDIT_CAPTION")}
                            className="flex-row items-center justify-between py-3 px-2 active:bg-gray-50 dark:active:bg-neutral-800 rounded-xl bg-transparent"
                          >
                            <View className="flex-row items-center bg-transparent">
                              <Edit3 size={20} color={iconColor} />
                              <ThemedText className="ml-3 text-sm font-medium">
                                {t("feedCard.editCaption")}
                              </ThemedText>
                            </View>
                            <ChevronRight size={16} color="#a3a3a3" />
                          </Pressable>

                          <Pressable
                            onPress={() => setMenuView("EDIT_HASHTAGS")}
                            className="flex-row items-center justify-between py-3 px-2 active:bg-gray-50 dark:active:bg-neutral-800 rounded-xl bg-transparent"
                          >
                            <View className="flex-row items-center bg-transparent">
                              <Hash size={20} color={iconColor} />
                              <ThemedText className="ml-3 text-sm font-medium">
                                {t("feedCard.editHashtags")}
                              </ThemedText>
                            </View>
                            <ChevronRight size={16} color="#a3a3a3" />
                          </Pressable>

                          <Pressable
                            onPress={() => setMenuView("EDIT_CATEGORY")}
                            className="flex-row items-center justify-between py-3 px-2 active:bg-gray-50 dark:active:bg-neutral-800 rounded-xl bg-transparent"
                          >
                            <View className="flex-row items-center bg-transparent">
                              <Layers size={20} color={iconColor} />
                              <ThemedText className="ml-3 text-sm font-medium">
                                {t("feedCard.changeCategory")}
                              </ThemedText>
                            </View>
                            <ChevronRight size={16} color="#a3a3a3" />
                          </Pressable>

                          <Pressable
                            onPress={() => setMenuView("EDIT_VISIBILITY")}
                            className="flex-row items-center justify-between py-3 px-2 active:bg-gray-50 dark:active:bg-neutral-800 rounded-xl bg-transparent"
                          >
                            <View className="flex-row items-center bg-transparent">
                              <Globe size={20} color={iconColor} />
                              <ThemedText className="ml-3 text-sm font-medium">
                                {t("feedCard.changePermission")}
                              </ThemedText>
                            </View>
                            <ChevronRight size={16} color="#a3a3a3" />
                          </Pressable>

                          <Pressable
                            onPress={() =>
                              setMenuView("EDIT_GIFTS_PERMISSIONS")
                            }
                            className="flex-row items-center justify-between py-3 px-2 active:bg-gray-50 dark:active:bg-neutral-800 rounded-xl bg-transparent"
                          >
                            <View className="flex-row items-center bg-transparent">
                              <Gift size={20} color={iconColor} />
                              <ThemedText className="ml-3 text-sm font-medium">
                                {t("feedCard.giftSettings")}
                              </ThemedText>
                            </View>
                            <ChevronRight size={16} color="#a3a3a3" />
                          </Pressable>

                          <Pressable
                            onPress={() => setMenuView("HIDE_CONFIRM")}
                            className="flex-row items-center py-3 px-2 active:bg-gray-50 dark:active:bg-neutral-800 rounded-xl bg-transparent"
                          >
                            <EyeOff size={20} color={iconColor} />
                            <ThemedText className="ml-3 text-sm font-medium">
                              {t("feedCard.hideFromFeed")}
                            </ThemedText>
                          </Pressable>
                        </>
                      )}

                      {hasVideo && (
                        <Pressable
                          onPress={() => setMenuView("EDIT_PLAYBACK_SPEED")}
                          className="flex-row items-center justify-between py-3 px-2 active:bg-gray-50 dark:active:bg-neutral-800 rounded-xl bg-transparent"
                        >
                          <View className="flex-row items-center bg-transparent">
                            <Gauge size={20} color={iconColor} />
                            <ThemedText className="ml-3 text-sm font-medium">
                              {t("feedCard.playbackSpeed")}
                            </ThemedText>
                          </View>
                          <ChevronRight size={16} color="#a3a3a3" />
                        </Pressable>
                      )}

                      {!isOwnPost && (
                        <Pressable
                          onPress={() => setMenuView("REPORT")}
                          className="flex-row items-center py-3 px-2 active:bg-orange-50/10 rounded-xl bg-transparent"
                        >
                          <ShieldAlert size={20} color="#f97316" />
                          <ThemedText className="ml-3 text-sm font-medium text-orange-500">
                            {t("feedCard.reportPost")}
                          </ThemedText>
                        </Pressable>
                      )}

                      {isOwnPost && (
                        <Pressable
                          onPress={() => setMenuView("DELETE_CONFIRM")}
                          className="flex-row items-center py-3 px-2 active:bg-red-50/10 rounded-xl bg-transparent"
                        >
                          <Trash2 size={20} color="#ef4444" />
                          <ThemedText className="ml-3 text-sm font-medium text-red-500">
                            {t("feedCard.deletePermanently")}
                          </ThemedText>
                        </Pressable>
                      )}
                    </ScrollView>
                  )}

                  {/* EDIT CAPTION */}
                  {menuView === "EDIT_CAPTION" && (
                    <View className="pb-6">
                      <ThemedText className="text-base font-bold mb-3">
                        {t("feedCard.editCaptionTitle")}
                      </ThemedText>
                      <TextInput
                        value={editDescription}
                        onChangeText={setEditDescription}
                        placeholder={t("feedCard.writeContext")}
                        placeholderTextColor="#a3a3a3"
                        multiline
                        numberOfLines={3}
                        editable={!isUpdating}
                        className="w-full min-h-[90px] p-3 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white mb-4"
                        style={{ textAlignVertical: "top" }}
                      />
                      <View className="flex-row items-center justify-end gap-2">
                        <Pressable
                          onPress={handleCancelEdit}
                          disabled={isUpdating}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-gray-500 font-semibold">
                            Back
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            handleFieldUpdate(
                              { description: editDescription.trim() },
                              "Caption updated successfully",
                            )
                          }
                          disabled={isUpdating}
                          className="py-2.5 px-5 bg-violet-600 rounded-xl min-w-[90px] items-center"
                        >
                          {isUpdating ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <ThemedText className="text-white font-semibold">
                              {t("feedCard.save")}
                            </ThemedText>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* PLAYBACK SPEED (video posts) */}
                  {menuView === "EDIT_PLAYBACK_SPEED" && (
                    <View className="pb-6">
                      <ThemedText className="text-base font-bold mb-1">
                        {t("feedCard.playbackSpeedTitle")}
                      </ThemedText>
                      <ThemedText className="text-xs text-gray-400 mb-3">
                        {t("feedCard.playbackSpeedHint")}
                      </ThemedText>

                      <View className="flex-row items-center gap-2 mb-4">
                        {PLAYBACK_SPEEDS.map((speed) => {
                          const isActiveSpeed = speed === playbackRate;
                          return (
                            <Pressable
                              key={speed}
                              onPress={() => handlePlaybackSpeedSelect(speed)}
                              className={`flex-1 py-2.5 rounded-xl items-center border ${
                                isActiveSpeed
                                  ? "bg-violet-600 border-violet-600"
                                  : "bg-transparent border-gray-200 dark:border-neutral-700"
                              }`}
                            >
                              <ThemedText
                                className={`text-sm font-semibold ${
                                  isActiveSpeed ? "text-white" : ""
                                }`}
                              >
                                {speed}x
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>

                      <View className="flex-row items-center justify-end">
                        <Pressable
                          onPress={() => setMenuView("MAIN")}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-gray-500 font-semibold">
                            Back
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* EDIT HASHTAGS */}
                  {menuView === "EDIT_HASHTAGS" && (
                    <View className="pb-6">
                      <ThemedText className="text-base font-bold mb-1">
                        {t("feedCard.editHashtagsTitle")}
                      </ThemedText>
                      <ThemedText className="text-xs text-gray-400 mb-3">
                        {t("feedCard.hashtagHint")}
                      </ThemedText>

                      <HashtagSection
                        hashtags={editHashtagsText}
                        onAddHashtag={handleAddHashtag}
                        onRemoveHashtag={handleRemoveHashtag}
                      />
                      <View className="flex-row items-center justify-end gap-2 mt-2">
                        <Pressable
                          onPress={handleCancelEdit}
                          disabled={isUpdating}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-gray-500 font-semibold">
                            Back
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={handleHashtagsSave}
                          disabled={isUpdating}
                          className="py-2.5 px-5 bg-violet-600 rounded-xl min-w-[90px] items-center"
                        >
                          {isUpdating ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <ThemedText className="text-white font-semibold">
                              {t("feedCard.save")}
                            </ThemedText>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* EDIT CATEGORY */}
                  {menuView === "EDIT_CATEGORY" && (
                    <View className="pb-6">
                      <ThemedText className="text-base font-bold mb-1">
                        {t("feedCard.editCategoryTitle")}
                      </ThemedText>
                      <ThemedText className="text-xs text-gray-400 mb-3">
                        {t("feedCard.editCategoryHint")}
                      </ThemedText>
                      <View className="flex-row items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 mb-4">
                        <CategorySection
                          category={editCategory}
                          onChange={setEditCategory}
                        />
                      </View>
                      <View className="flex-row items-center justify-end gap-2">
                        <Pressable
                          onPress={handleCancelEdit}
                          disabled={isUpdating}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-gray-500 font-semibold">
                            Back
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            handleFieldUpdate(
                              { category: editCategory.trim() },
                              "Category saved successfully",
                            )
                          }
                          disabled={isUpdating}
                          className="py-2.5 px-5 bg-violet-600 rounded-xl min-w-[90px] items-center"
                        >
                          {isUpdating ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <ThemedText className="text-white font-semibold">
                              Save
                            </ThemedText>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* EDIT VISIBILITY */}
                  {menuView === "EDIT_VISIBILITY" && (
                    <View className="pb-6">
                      <ThemedText className="text-base font-bold mb-3">
                        {t("feedCard.adjustPrivacy")}
                      </ThemedText>

                      <ThemedView className="bg-gray-50 dark:bg-neutral-900 rounded-2xl mb-4 overflow-hidden">
                        <PrivacySection
                          audience={audience}
                          commentPrivacy={commentPrivacy}
                          onAudienceChange={setAudience}
                          onCommentPrivacyChange={setCommentPrivacy}
                        />
                      </ThemedView>

                      <View className="flex-row items-center justify-end gap-2">
                        <Pressable
                          onPress={handleCancelEdit}
                          disabled={isUpdating}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-gray-500 font-semibold">
                            Back
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            handleFieldUpdate(
                              {
                                visibility: audience,
                                commentPermission: commentPrivacy,
                              },
                              "Privacy updated successfully",
                            )
                          }
                          disabled={isUpdating}
                          className="py-2.5 px-5 bg-violet-600 rounded-xl min-w-[90px] items-center"
                        >
                          {isUpdating ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <ThemedText className="text-white font-semibold">
                              {t("feedCard.update")}
                            </ThemedText>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* EDIT GIFTS PERMISSIONS */}
                  {menuView === "EDIT_GIFTS_PERMISSIONS" && (
                    <View className="pb-6">
                      <ThemedText className="text-base font-bold mb-1">
                        {t("feedCard.giftSettingsTitle")}
                      </ThemedText>
                      <ThemedText className="text-xs text-gray-400 mb-3">
                        {t("feedCard.giftSettingsHint")}
                      </ThemedText>

                      <ThemedView className="flex-row items-center justify-between py-4 mb-4 bg-transparent border-t border-b border-gray-100 dark:border-neutral-800">
                        <ThemedView className="bg-transparent flex-1 pr-4">
                          <ThemedText className="text-sm font-medium">
                            {t("feedCard.receiveAwards")}
                          </ThemedText>
                          <ThemedText className="text-xs text-gray-400">
                            {t("feedCard.receiveAwardsHint")}
                          </ThemedText>
                        </ThemedView>
                        <Switch
                          value={editGiftsEnabled}
                          onValueChange={(val) => setEditGiftsEnabled(val)}
                          disabled={isUpdating}
                          trackColor={{ false: "#d4d4d4", true: "#c084fc" }}
                          thumbColor={editGiftsEnabled ? "#7c3aed" : "#f5f5f5"}
                        />
                      </ThemedView>

                      <View className="flex-row items-center justify-end gap-2">
                        <Pressable
                          onPress={handleCancelEdit}
                          disabled={isUpdating}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-gray-500 font-semibold">
                            Back
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            handleFieldUpdate(
                              { giftsEnabled: editGiftsEnabled },
                              "Gift preferences applied",
                            )
                          }
                          disabled={isUpdating}
                          className="py-2.5 px-5 bg-violet-600 rounded-xl min-w-[90px] items-center"
                        >
                          {isUpdating ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <ThemedText className="text-white font-semibold">
                              {t("feedCard.savePreference")}
                            </ThemedText>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* REPORT INPUT */}
                  {menuView === "REPORT" && (
                    <ThemedView className="bg-transparent mt-2 pb-6">
                      <ThemedText className="text-base font-bold mb-2">
                        {t("feedCard.reportTitle")}
                      </ThemedText>
                      <ThemedText className="text-xs text-gray-400 mb-3">
                        {t("feedCard.reportHint")}
                      </ThemedText>
                      <TextInput
                        value={reportReason}
                        onChangeText={setReportReason}
                        placeholder={t("feedCard.reportReasonPlaceholder")}
                        placeholderTextColor="#a3a3a3"
                        multiline
                        numberOfLines={3}
                        editable={!isReporting}
                        className="w-full min-h-[80px] p-3 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 text-black dark:text-white"
                        style={{ textAlignVertical: "top" }}
                      />
                      <ThemedView className="flex-row items-center justify-end mt-4 bg-transparent gap-2">
                        <Pressable
                          onPress={() => setMenuView("MAIN")}
                          disabled={isReporting}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-sm font-semibold text-gray-500">
                            {t("feedCard.cancel")}
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={handleReportSubmit}
                          disabled={!reportReason.trim() || isReporting}
                          className={`py-2.5 px-5 rounded-xl active:opacity-80 flex-row items-center justify-center ${reportReason.trim() && !isReporting ? "bg-orange-500" : "bg-orange-300"}`}
                        >
                          {isReporting ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <ThemedText className="text-sm font-semibold text-white">
                              {t("feedCard.submitReport")}
                            </ThemedText>
                          )}
                        </Pressable>
                      </ThemedView>
                    </ThemedView>
                  )}

                  {/* HIDE CONFIRMATION */}
                  {menuView === "HIDE_CONFIRM" && (
                    <ThemedView className="bg-transparent mt-2 pb-6">
                      <ThemedText className="text-base font-bold mb-2">
                        {t("feedCard.hideConfirmTitle")}
                      </ThemedText>
                      <ThemedText className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                        {t("feedCard.hideConfirmMsg")}
                      </ThemedText>
                      <ThemedView className="flex-row items-center justify-end bg-transparent gap-2">
                        <Pressable
                          onPress={() => setMenuView("MAIN")}
                          disabled={isHiding}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-sm font-semibold text-gray-500">
                            {t("feedCard.cancel")}
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          onPress={handleHideConfirm}
                          disabled={isHiding}
                          className="py-2.5 px-5 rounded-xl bg-neutral-800 dark:bg-neutral-200 active:opacity-80 flex-row items-center justify-center min-w-[100px]"
                          style={{ backgroundColor: colors.primary }}
                        >
                          {isHiding ? (
                            <ActivityIndicator
                              color={
                                colorScheme === "dark" ? "#000000" : "#ffffff"
                              }
                              size="small"
                            />
                          ) : (
                            <ThemedText
                              style={{ color: colors.white }}
                              className="text-sm font-semibold text-white dark:text-black"
                            >
                              {t("feedCard.hidePost")}
                            </ThemedText>
                          )}
                        </Pressable>
                      </ThemedView>
                    </ThemedView>
                  )}

                  {/* DELETE CONFIRMATION */}
                  {menuView === "DELETE_CONFIRM" && (
                    <ThemedView className="bg-transparent mt-2 pb-6">
                      <ThemedText className="text-base font-bold mb-2 text-red-500">
                        {t("feedCard.deleteConfirmTitle")}
                      </ThemedText>
                      <ThemedText className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                        {t("feedCard.deleteConfirmMsg")}
                      </ThemedText>
                      <ThemedView className="flex-row items-center justify-end bg-transparent gap-2">
                        <Pressable
                          onPress={() => setMenuView("MAIN")}
                          disabled={isDeleting}
                          className="py-2.5 px-4"
                        >
                          <ThemedText className="text-sm font-semibold text-gray-500">
                            {t("feedCard.cancel")}
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={handleDeleteConfirm}
                          disabled={isDeleting}
                          className="py-2.5 px-5 rounded-xl bg-red-500 active:opacity-80 flex-row items-center justify-center min-w-[90px]"
                        >
                          {isDeleting ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <ThemedText className="text-sm font-semibold text-white">
                              {t("feedCard.delete")}
                            </ThemedText>
                          )}
                        </Pressable>
                      </ThemedView>
                    </ThemedView>
                  )}
                </ThemedView>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Modal>
      </Pressable>
    </View>
  );
}

// Memoized so scroll-driven re-renders of the feed screen don't repaint every
// mounted card (each holds ~15 state hooks and a video player). Safe because
// the card never mutates `post` in place and the parent's callbacks are
// stable — see renderFeedItem in app/(tabs)/index.tsx.
export default memo(FeedCard);

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    // backgroundColor: "#000",
    position: "relative",
    overflow: "hidden",
  },
  paginationDots: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  mediaItemBadge: {
    position: "absolute",
    top: 50,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  mediaItemBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  doubleTapHeartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  textPostHero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  textPostHeroText: {
    color: "#fff",
    maxWidth: SCREEN_WIDTH - 110,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  topRow: {
    alignItems: "flex-start",
  },
  bottomLeftColumn: {
    flex: 1,
    // Reserve space for the centered right action rail so long captions /
    // usernames never run underneath it.
    marginRight: 60,
  },
  actionColumnWrapper: {
    position: "absolute",
    top: 0,
    right: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 10,
  },
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  headerTextGroup: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  usernameText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  timeText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    marginTop: 2,
  },
  followPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  followingPill: {
    // backgroundColor: "rgba(255,255,255,0.2)",
  },
  followPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  captionText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 2,
  },
  moreLessText: {
    color: "#e5e5e5",
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 4,
  },
  hashtagText: {
    color: "#93c5fd",
    fontWeight: "600",
    fontSize: 13,
  },
  rightActionColumn: {
    alignItems: "center",
    gap: 20,
  },
  actionItem: {
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
