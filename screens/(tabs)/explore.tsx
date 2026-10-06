import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Text,
  Dimensions,
  Alert,
  Modal,
  Image,
  StatusBar,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Tabs, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";
import {
  CameraBackend,
  LIVE_FILTERS,
  useCameraAccess,
  useMicrophoneAccess,
} from "@/components/camera/cameraBackend";
import { zoomFactorFromSelector, type FilterCameraHandle } from "@/components/camera/cameraTypes";
import { bakePhotoFilter } from "@/utils/bakePhotoFilter";
import FilterStrip from "@/components/camera/filterStrip";
import FilterTintOverlay from "@/components/camera/filterTintOverlay";
import FilterSheet from "@/components/camera/filterSheet";
import FilteredImage from "@/components/camera/filteredImage";
import FilteredVideoPreview from "@/components/camera/filteredVideoPreview";
import { FILTER_BY_ID, filtersFor, type CameraFilter } from "@/constants/cameraFilters";
import { useVideoPlayer, VideoView } from "expo-video";
import * as VideoThumbnails from "expo-video-thumbnails";

import { useTheme } from "@/hooks/useTheme";
import { useCreateRestriction } from "@/hooks/useCreateRestriction";
import { ThemedText } from "@/components/ui/ThemedText";
import CreatePostHeader from "@/components/post/createPostHeader";
import UserInfoCard from "@/components/post/userInfoCard";
import CaptionInput from "@/components/post/captionInput";
import MediaGrid from "@/components/post/mediaGrid";
import HashtagSection from "@/components/post/hashtagSection";
import TagPeopleSection from "@/components/post/tagPeopleSection";
import CategorySection from "@/components/post/categorySection";
import GiftSwitch from "@/components/post/giftSwitch";
import PrivacySection from "@/components/post/privacySection";
import BottomActions from "@/components/post/bottomActions";
import { Media } from "@/components/post/mediaItem";
import TextPostComposer, {
  type TextPostSlide,
} from "@/components/post/textPostComposer";
import TagPeopleModal from "@/components/post/tagPeopleModal";

// Camera Sub-components
import SideControls from "@/components/camera/sideControls";
import ZoomSelector from "@/components/camera/zoomSelector";
import BottomControls from "@/components/camera/bottomControls";
import { showError, showSuccess } from "@/components/ui/toast";
import { useAuthStore } from "@/store/authStore";
import { CreatePostPayload, postService } from "@/service/post.service";
import { searchService } from "@/service/search.service";
import { userService } from "@/service/profile.Service";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LevelBadge } from "@/components/levelBadge";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { useTranslation } from "@/hooks/useTranslation";
import {
  createOptimisticId,
  useOptimisticMutation,
} from "@/hooks/useOptimisticMutation";
import { usePostDraftStore } from "@/store/postDraftStore";
import { usePendingSoundStore } from "@/store/pendingSoundStore";
import { IMAGE_QUALITY } from "@/constants/mediaQuality";
import { compressForUpload } from "@/utils/compressMedia";
import { SOUND_CLIP_MS, type SoundSelection } from "@/service/sound.service";
import { useSoundPlayback } from "@/hooks/useSoundPlayback";
import AddSoundRow from "@/components/sound/addSoundRow";
import SoundPickerModal from "@/components/sound/soundPickerModal";
import AuthHeader from "@/components/auth/authHeader";
const { width, height } = Dimensions.get("window");

const STATUS_BAR_HEIGHT =
  Platform.OS === "ios"
    ? height >= 812
      ? 47
      : 20
    : StatusBar.currentHeight || 0;

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { isRestricted, guardCreate } = useCreateRestriction();
  const cameraRef = useRef<FilterCameraHandle>(null);
  const insets = useSafeAreaInsets();
  // --- Permissions Hooks ---
  const cameraPermission = useCameraAccess();
  const micPermission = useMicrophoneAccess();

  // --- Post Setup State ---
  const [caption, setCaption] = useState("");
  const [allowGift, setAllowGift] = useState(true);
  interface TaggableUser {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profilePictureUrl?: string | null;
    avatar?: string;
  }

  const [hashtags, setHashtags] = useState<string[]>([]);
  // Sound played alongside the post (TikTok-style)
  const [soundSelection, setSoundSelection] = useState<SoundSelection | null>(null);
  const [isSoundPickerOpen, setIsSoundPickerOpen] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<TaggableUser[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<TaggableUser[]>([]);
  const [usersCursor, setUsersCursor] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [tagListMode, setTagListMode] = useState<"followers" | "following" | "everyone">("followers");
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState<
    "public" | "friends" | "school_only"
  >("public");
  const [commentPrivacy, setCommentPrivacy] = useState<"everyone" | "nobody">(
    "everyone",
  );
  const [mediaList, setMediaList] = useState<Media[]>([]);

  // --- Preview & Modal States ---
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- Create-type picker (Post / Text) shown each time this tab opens ---
  const [showTypePicker, setShowTypePicker] = useState(true);
  // The sound came from "Use this sound" — dropped if the user backs out of the picker
  const soundFromUseRef = useRef(false);
  const [isTextPostVisible, setIsTextPostVisible] = useState(false);

  // --- Camera UI States ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [zoom, setZoom] = useState(0.15);
  const [cameraMode, setCameraMode] = useState("PHOTO");
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [grid, setGrid] = useState(false);

  // --- Recording States ---
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // Timer in seconds
  // Read by the async "recording finished" callback (state there would be stale)
  const recordingDurationRef = useRef(0);
  recordingDurationRef.current = recordingDuration;
  const [recordingSession, setRecordingSession] = useState(0);
  // A sound chosen before recording plays while recording (paused with it) so
  // the user can perform to it. Loaded ahead while the camera is open, and
  // each new recording starts it from the clip start.
  useSoundPlayback(soundSelection, isCameraOpen && !isSoundPickerOpen, {
    ignoreMute: true,
    paused: !isRecording || isRecordingPaused,
    restartKey: recordingSession,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<"4:3" | "16:9">("4:3");
  const [hdrEnabled, setHdrEnabled] = useState(false);

  // --- Camera filters, picked before capture (TikTok-style). Live in dev/prod
  // builds; Expo Go shows an approximate tint and applies the real one to the capture ---
  const [filterId, setFilterId] = useState("original");
  const [filtersAvailable, setFiltersAvailable] = useState(LIVE_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const captureMode: "photo" | "video" = cameraMode === "VIDEO" ? "video" : "photo";
  const availableFilters = useMemo(() => filtersFor(captureMode), [captureMode]);
  const filter: CameraFilter = FILTER_BY_ID[filterId] ?? FILTER_BY_ID.original;

  // Photo-only filters (colour tints) can't be applied to video — reset when switching
  useEffect(() => {
    if (!availableFilters.some((f) => f.id === filterId)) setFilterId("original");
  }, [availableFilters, filterId]);

  // Filter name flashes in the middle when it changes
  const filterNameOpacity = useRef(new Animated.Value(0)).current;
  const [filterFlashName, setFilterFlashName] = useState<string | null>(null);
  const selectFilter = (next: CameraFilter) => {
    setFilterId(next.id);
    setFilterFlashName(next.name);
    filterNameOpacity.stopAnimation();
    filterNameOpacity.setValue(1);
    Animated.timing(filterNameOpacity, { toValue: 0, duration: 900, delay: 500, useNativeDriver: true }).start();
  };

  // Swipe left/right on the camera to change filter
  const filterSwipeState = useRef({ filters: availableFilters, filterId, recording: isRecording });
  filterSwipeState.current = { filters: availableFilters, filterId, recording: isRecording };
  const filterSwipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        const { filters, filterId: current, recording } = filterSwipeState.current;
        if (recording || Math.abs(g.dx) < 60) return;
        const index = Math.max(0, filters.findIndex((f) => f.id === current));
        const nextIndex = g.dx < 0 ? Math.min(filters.length - 1, index + 1) : Math.max(0, index - 1);
        if (nextIndex !== index) selectFilter(filters[nextIndex]);
      },
    }),
  ).current;

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Video Playback States ---
  const [activeVideoUri, setActiveVideoUri] = useState<string | null>(null);
  const [activeVideoThumbnail, setActiveVideoThumbnail] = useState<
    string | null
  >(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  // Media item open in the preview (photo or video) — its filter can be changed there
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const previewItem = previewItemId ? mediaList.find((m) => m.id === previewItemId) : undefined;
  const previewFilter = previewItem?.filterId ? FILTER_BY_ID[previewItem.filterId] : undefined;
  // Filter-camera / filtered videos are raw files: preview them through the filter
  const activeVideoFilter = previewItem?.type === "video" ? previewFilter : undefined;

  const videoPlayer = useVideoPlayer(activeVideoUri || "", (player) => {
    player.loop = false;
  });

  // Previewing media from the grid plays the post's sound, as the feed will:
  // over a photo straight away, over a video while it plays. Each preview
  // starts the clip from its start.
  const [previewSession, setPreviewSession] = useState(0);
  useSoundPlayback(soundSelection, !!previewItem && !isCameraOpen && !isSoundPickerOpen, {
    ignoreMute: true,
    paused: previewItem?.type === "video" && !isVideoPlaying,
    restartKey: previewSession,
  });
  // With a sound, the video's own audio is muted (as it will be in the feed)
  useEffect(() => {
    try {
      videoPlayer.muted = !!soundSelection;
    } catch {
      // Player already released
    }
  }, [videoPlayer, soundSelection]);
  // When the video ends, stop the sound with it
  useEffect(() => {
    const sub = videoPlayer.addListener("playToEnd", () => setIsVideoPlaying(false));
    return () => sub.remove();
  }, [videoPlayer]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      if (recordingIntervalRef.current)
        clearInterval(recordingIntervalRef.current);
    };
  }, []);

  // A post whose background upload failed. Its draft has been restored into
  // the form state; the next visit to this tab reopens it (preview or text
  // composer) so the user can tap Post again or keep editing.
  // A ref, not state: clearing it must not re-run the focus effect below
  // (which would pop the type picker over the reopened draft).
  const failedDraftKindRef = useRef<"media" | "text" | null>(null);
  // Slides of a failed text post, handed back to the composer on reopen.
  const [textDraftSlides, setTextDraftSlides] = useState<
    TextPostSlide[] | null
  >(null);
  const isFocusedRef = useRef(false);
  // The saved draft currently loaded in the form (if any): saving again
  // updates it, and publishing removes it once the server accepts the post.
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const saveDraftToStore = usePostDraftStore((state) => state.saveDraft);
  const removeSavedDraft = usePostDraftStore((state) => state.removeDraft);

  const reopenDraft = useCallback((kind: "media" | "text") => {
    setShowTypePicker(false);
    if (kind === "media") {
      setIsPreviewOpen(true);
    } else {
      setIsTextPostVisible(true);
    }
    failedDraftKindRef.current = null;
  }, []);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const formatEnum = (val: string) =>
    val.trim().toLowerCase().replace(/\s+/g, "_");

  // Backend doesn't yet support a true "public" visibility, so it is
  // mapped down to "friends" — mirrors the media-post publish path.
  const mapAudienceAndComment = (
    currentAudience: "public" | "friends" | "school_only",
    currentCommentPrivacy: "everyone" | "nobody",
  ) => {
    let mappedVisibility = formatEnum(currentAudience);
    if (mappedVisibility === "public") {
      mappedVisibility = "friends";
    }
    const mappedCommentPermission = formatEnum(currentCommentPrivacy);
    return { mappedVisibility, mappedCommentPermission };
  };

  const formatRecordingTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleAddHashtag = (newTag: string) => {
    setHashtags((prev) => [...prev, newTag]);
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  async function generateVideoThumbnail(
    videoUri: string,
  ): Promise<string | null> {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 100,
      });
      return uri;
    } catch (e) {
      console.warn("Could not generate video preview thumbnail:", e);
      return null;
    }
  }

  const resetRecordingState = () => {
    if (recordingIntervalRef.current)
      clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingDuration(0);
    setIsProcessing(false);
  };

  const handlePauseResumeRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    if (isRecordingPaused) {
      // RESUME
      try {
        await cameraRef.current.resumeRecording();
        setIsRecordingPaused(false);

        // Resume timer interval
        recordingIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      } catch (e) {
        console.error("Failed to resume recording:", e);
      }
    } else {
      // PAUSE
      try {
        if (recordingIntervalRef.current)
          clearInterval(recordingIntervalRef.current);
        await cameraRef.current.pauseRecording();
        setIsRecordingPaused(true);
      } catch (e) {
        console.error("Failed to pause recording:", e);
      }
    }
  };

  async function runCapture() {
    const camera = cameraRef.current;
    if (!camera || isProcessing) return;

    if (cameraMode === "PHOTO") {
      try {
        setIsProcessing(true);
        // With live filters it comes back with the filter already applied
        const uri = await camera.takePhoto();
        // Otherwise the filter picked on the camera is baked in at publish
        // (and can still be changed in the preview)
        const newPhoto: Media = {
          id: generateId(),
          uri,
          type: "image",
          filterId: !filtersAvailable && filterId !== "original" ? filterId : undefined,
          liveFiltered: filtersAvailable,
        };
        setMediaList((prev) => [newPhoto, ...prev]);
        setIsCameraOpen(false);
      } catch (e) {
        console.error("Failed to take photo:", e);
        Alert.alert(t("explore.publishErrorTitle"), "Couldn't take the photo. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    } else if (cameraMode === "VIDEO") {
      if (isRecording) {
        // STOP RECORDING — the result arrives in onFinished below
        try {
          setIsProcessing(true);
          if (recordingIntervalRef.current)
            clearInterval(recordingIntervalRef.current);
          await camera.stopRecording();
        } catch (e) {
          console.error("Failed to stop recording:", e);
          setIsProcessing(false);
        }
      } else {
        // START RECORDING — the mic is only needed when no sound replaces the audio
        if (!soundSelection && !micPermission.hasPermission) {
          const granted = micPermission.canRequestPermission
            ? await micPermission.requestPermission()
            : false;
          if (!granted) {
            Alert.alert(
              t("explore.permissionMicTitle"),
              t("explore.permissionMicMsg"),
            );
            return;
          }
        }

        // Video frames are recorded raw; the server applies this filter on upload
        const recordedFilter = filterId;

        try {
          setIsRecording(true);
          setIsRecordingPaused(false);
          setRecordingDuration(0);
          setRecordingSession((n) => n + 1);

          // Start timer interval
          recordingIntervalRef.current = setInterval(() => {
            setRecordingDuration((prev) => prev + 1);
          }, 1000);

          await camera.startRecording({
            // With a sound, the video is as long as the clip at most
            maxDuration: soundSelection ? SOUND_CLIP_MS / 1000 : undefined,
            onFinished: async (uri) => {
              try {
                const formattedDuration = formatRecordingTime(recordingDurationRef.current);
                const thumbnailUri = await generateVideoThumbnail(uri);
                const newVideo: Media = {
                  id: generateId(),
                  uri,
                  type: "video",
                  duration: formattedDuration,
                  thumbnail: thumbnailUri || undefined,
                  filterId: recordedFilter !== "original" ? recordedFilter : undefined,
                  liveFiltered: filtersAvailable,
                };
                setMediaList((prev) => [newVideo, ...prev]);
                setIsCameraOpen(false);
              } finally {
                resetRecordingState();
              }
            },
            onError: (e) => {
              console.error("Error during video recording:", e);
              resetRecordingState();
            },
          });
        } catch (e) {
          console.error("Failed to initiate recording:", e);
          resetRecordingState();
        }
      }
    }
  }

  async function handleCapture() {
    if (countdown !== null) {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      setCountdown(null);
      setIsProcessing(false);
      return;
    }

    if (timer === 0 || (cameraMode === "VIDEO" && isRecording)) {
      runCapture();
      return;
    }

    setIsProcessing(true);
    setCountdown(timer);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount === null) {
          clearInterval(countdownIntervalRef.current!);
          return null;
        }
        if (prevCount <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setCountdown(null);
          runCapture();
          return null;
        }
        return prevCount - 1;
      });
    }, 1000);
  }

  async function handleOpenGallery() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("explore.permissionGalleryTitle"),
          t("explore.permissionGalleryMsg"),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        // Smaller uploads: photos re-saved at 80%, videos exported at 720p (iOS);
        // anything still too big is compressed before upload (utils/compressMedia)
        quality: IMAGE_QUALITY,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
      });

      if (!result.canceled) {
        const selectedMediaPromises = result.assets.map(async (asset) => {
          let thumbnailUri: string | null = null;
          if (asset.type === "video") {
            thumbnailUri = await generateVideoThumbnail(asset.uri);
          }

          return {
            id: generateId(),
            uri: asset.uri,
            type: (asset.type === "video" ? "video" : "image") as
              "video" | "image",
            thumbnail: thumbnailUri || undefined,
            duration: asset.duration
              ? `${Math.floor(asset.duration / 60)}:${String(Math.floor(asset.duration % 60)).padStart(2, "0")}`
              : undefined,
          };
        });

        const selectedMedia = await Promise.all(selectedMediaPromises);
        setMediaList((prev) => [...selectedMedia, ...prev]);
        setIsCameraOpen(false);
      }
    } catch (error) {
      console.error("Error picking from gallery:", error);
    }
  }

  const handleOpenCamera = async () => {
    if (!cameraPermission.hasPermission) {
      const granted = cameraPermission.canRequestPermission
        ? await cameraPermission.requestPermission()
        : false;
      if (!granted) {
        Alert.alert(            t("explore.permissionCameraTitle"),
              t("explore.permissionCameraMsg"),
        );
        return;
      }
    }
    setIsCameraOpen(true);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const fetchTagUsers = async (isReset = false) => {
    if (!user?.id) return;
    if (isReset) {
      setUsersCursor(null);
      setAvailableUsers([]);
    }

    try {
      if (isReset) {
        setIsLoadingUsers(true);
      } else {
        setIsLoadingMoreUsers(true);
      }

      if (tagListMode === "followers" || tagListMode === "following") {
        const params: { search?: string; limit: number; cursor?: string } = {
          search: debouncedSearchQuery || undefined,
          limit: 25,
        };
        if (!isReset && usersCursor) {
          params.cursor = usersCursor;
        }

        const response =
          tagListMode === "followers"
            ? await userService.getFollowers(user.id, params)
            : await userService.getFollowing(user.id, params);

        setAvailableUsers((prev) =>
          isReset ? response.items || [] : [...prev, ...(response.items || [])],
        );
        setUsersCursor(response.nextCursor || null);
      } else {
        if (!debouncedSearchQuery) {
          setAvailableUsers([]);
          setUsersCursor(null);
          return;
        }

        const response = await searchService.searchUsers(debouncedSearchQuery, 25);
        setAvailableUsers(response.items || []);
        setUsersCursor(null);
      }
    } catch (err) {
      console.error("Failed to load users for tagging:", err);
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingMoreUsers(false);
    }
  };

  useEffect(() => {
    if (!isTagModalOpen) return;
    fetchTagUsers(true);
  }, [isTagModalOpen, debouncedSearchQuery, tagListMode]);

  const handleOpenTagModal = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setIsTagModalOpen(true);
  };

  const handleCloseTagModal = () => {
    setIsTagModalOpen(false);
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setAvailableUsers([]);
    setUsersCursor(null);
  };

  const toggleTaggedUser = (userToToggle: TaggableUser) => {
    setTaggedUsers((prev) => {
      const exists = prev.some((user) => user.id === userToToggle.id);
      if (exists) {
        return prev.filter((user) => user.id !== userToToggle.id);
      }
      return [...prev, userToToggle];
    });
  };

  const handlePressMediaItem = (item: Media & { thumbnail?: string }) => {
    setPreviewItemId(item.id);
    setPreviewSession((n) => n + 1);
    if (item.type === "video") {
      setActiveVideoUri(item.uri);
      setActiveVideoThumbnail(item.thumbnail || item.uri);
      setIsVideoPlaying(false);
    }
  };

  const closeMediaPreview = () => {
    videoPlayer.pause();
    setActiveVideoUri(null);
    setIsVideoPlaying(false);
    setPreviewItemId(null);
  };

  /** Filter chosen after capture for one media item (photos baked at publish, videos by the server). */
  const setMediaFilter = (id: string, nextFilterId: string) => {
    setMediaList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, filterId: nextFilterId === "original" ? undefined : nextFilterId } : m)),
    );
  };

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
    // Filtered videos play through Skia (FilteredVideoPreview) instead
    if (!activeVideoFilter) videoPlayer.play();
  };

  function handleRemoveMedia(id: string) {
    setMediaList((prev) => prev.filter((item) => item.id !== id));
  }

  function flipCamera() {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  function handleCloseCamera() {
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    resetRecordingState();
    setIsCameraOpen(false);
  }

  const handleOpenPreview = () => {
    // A post is publishable with just text (like a text story), just media,
    // or both — but never empty.
    if (!caption.trim() && mediaList.length === 0) {
      showError(
        t("explore.missingContentMsg"),
        t("explore.missingContentTitle"),
      );
      return;
    }

    setIsPreviewOpen(true);
  };

  // Everything needed to put a post back into the form if its upload fails.
  type PostDraft = {
    kind: "media" | "text";
    caption: string;
    mediaList: Media[];
    slides: TextPostSlide[] | null;
    hashtags: string[];
    taggedUsers: TaggableUser[];
    category: string;
    audience: "public" | "friends" | "school_only";
    commentPrivacy: "everyone" | "nobody";
    allowGift: boolean;
    sound: SoundSelection | null;
    /** Saved draft this post came from (see currentDraftId) */
    draftId: string | null;
  };

  const snapshotDraft = (
    kind: "media" | "text",
    slides: TextPostSlide[] | null = null,
  ): PostDraft => ({
    kind,
    caption,
    mediaList,
    slides,
    hashtags,
    taggedUsers,
    category,
    audience,
    commentPrivacy,
    allowGift,
    sound: soundSelection,
    draftId: currentDraftId,
  });

  // Clears the form right away so the next post starts fresh, even while the
  // previous one is still uploading.
  const resetComposer = () => {
    setCaption("");
    setMediaList([]);
    setHashtags([]);
    setTaggedUsers([]);
    setCategory("");
    setAudience("public");
    setCommentPrivacy("everyone");
    setAllowGift(true);
    setSoundSelection(null);
    setTextDraftSlides(null);
    setCurrentDraftId(null);
  };

  const restoreDraft = (draft: PostDraft) => {
    setCaption(draft.caption);
    setMediaList(draft.mediaList);
    setHashtags(draft.hashtags);
    setTaggedUsers(draft.taggedUsers);
    setCategory(draft.category);
    setAudience(draft.audience);
    setCommentPrivacy(draft.commentPrivacy);
    setAllowGift(draft.allowGift);
    setSoundSelection(draft.sound ?? null);
    setTextDraftSlides(draft.slides);
    setCurrentDraftId(draft.draftId);
  };

  // Saves the current post (media or text) as a draft on this device. It
  // shows in the profile's Drafts tab, from where it reopens here to post.
  const handleSaveDraft = async (
    kind: "media" | "text",
    slides: TextPostSlide[] | null = null,
  ) => {
    const hasContent =
      kind === "text"
        ? !!slides?.some((slide) => slide.text.trim().length > 0)
        : !!caption.trim() || mediaList.length > 0;
    if (!hasContent) {
      showError(
        t("explore.missingContentMsg"),
        t("explore.missingContentTitle"),
      );
      return;
    }

    try {
      const { draftId: _draftId, ...draft } = snapshotDraft(kind, slides);
      await saveDraftToStore(draft, currentDraftId);
      showSuccess(t("explore.draftSaved"));
      resetComposer();
      setIsPreviewOpen(false);
      setIsTextPostVisible(false);
      router.back();
    } catch (error) {
      console.error("Failed to save draft:", error);
      showError(t("explore.draftSaveFailed"));
    }
  };

  // Re-open the create-type picker every time the user lands on this tab,
  // mirroring how the story row asks "Camera/Media or Text" each time —
  // unless a failed post is waiting, in which case its draft reopens instead.
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      // "Use this sound" on someone's post: straight to the camera with it picked
      const pendingSound = usePendingSoundStore.getState().consume("post");
      // A saved draft picked in the profile's Drafts tab: fill the form (or
      // the text composer) with it so the user can edit and post.
      const savedDraft = pendingSound ? null : usePostDraftStore.getState().consumePendingOpenDraft();
      if (pendingSound) {
        // Same as the story flow: the Create Post picker (post or text), with
        // the sound already chosen for whichever they pick
        setSoundSelection(pendingSound);
        soundFromUseRef.current = true;
        setIsPreviewOpen(false);
        setIsTextPostVisible(false);
        setShowTypePicker(true);
      } else if (savedDraft) {
        failedDraftKindRef.current = null;
        restoreDraft({
          ...savedDraft,
          taggedUsers: savedDraft.taggedUsers as TaggableUser[],
          sound: savedDraft.sound ?? null,
          draftId: savedDraft.id,
        });
        setShowTypePicker(false);
        setIsPreviewOpen(false);
        setIsTextPostVisible(savedDraft.kind === "text");
      } else if (failedDraftKindRef.current) {
        reopenDraft(failedDraftKindRef.current);
      } else {
        setShowTypePicker(true);
      }
      return () => {
        isFocusedRef.current = false;
      };
      // restoreDraft is recreated every render; listing it would re-run this
      // on every render while focused and keep reopening the type picker.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reopenDraft])
  );

  // Publishing is optimistic for both media and text posts: the composed post
  // is shown in the home feed immediately (with a temp id), the form clears
  // and the screen closes, and the upload continues in the background.
  // NEW_POST_CONFIRMED swaps it for the server copy. If the upload fails,
  // NEW_POST_REMOVED drops it from the feed and the draft is restored here so
  // the user can post again. See the listeners in app/(tabs)/index.tsx.
  const publishMutation = useOptimisticMutation<
    any,
    {
      tempId: string;
      optimistic: any;
      payload: CreatePostPayload;
      /** filterId: photo filter chosen after capture, baked in just before upload */
      files: { uri: string; type: string; name: string; filterId?: string }[];
      draft: PostDraft;
    }
  >({
    apply: ({ optimistic }) => {
      resetComposer();
      setIsPreviewOpen(false);
      setIsTextPostVisible(false);
      DeviceEventEmitter.emit("NEW_POST_PUBLISHED", optimistic);
    },
    rollback: ({ tempId, draft }) => {
      DeviceEventEmitter.emit("NEW_POST_REMOVED", { tempId });
      restoreDraft(draft);
      if (isFocusedRef.current) {
        // Already back on this tab — reopen the draft right away.
        reopenDraft(draft.kind);
      } else {
        failedDraftKindRef.current = draft.kind;
      }
    },
    // In the background upload: photos filtered after capture get the filter
    // baked in, then everything is shrunk to upload size (720p video / resized
    // photo). One file at a time — compressing videos in parallel strains older phones.
    request: async ({ payload, files }) => {
      const ready: { uri: string; type: string; name: string }[] = [];
      for (const { filterId: photoFilter, ...file } of files) {
        let item = photoFilter
          ? {
              uri: await bakePhotoFilter(file.uri, photoFilter),
              type: "image/jpeg",
              name: file.name.replace(/\.\w+$/, "") + ".jpg",
            }
          : file;
        const isVideo = item.type.startsWith("video");
        const compressed = await compressForUpload(item.uri, isVideo ? "video" : "photo");
        if (compressed !== item.uri) {
          const base = item.name.replace(/\.\w+$/, "");
          item = isVideo
            ? { uri: compressed, type: "video/mp4", name: `${base}.mp4` }
            : { uri: compressed, type: "image/jpeg", name: `${base}.jpg` };
        }
        ready.push(item);
      }
      return postService.createPost(payload, ready);
    },
    onSuccess: (response, { tempId, optimistic, draft }) => {
      if (draft.draftId) removeSavedDraft(draft.draftId);
      const rawNewPost = response?.data || response;
      // Keep the local data (e.g. media/text slides) the server may not echo
      // back yet, while adopting the real id and server fields.
      const confirmed = {
        ...optimistic,
        ...rawNewPost,
        media: rawNewPost?.media ?? optimistic.media,
        textSlides: rawNewPost?.textSlides ?? optimistic.textSlides,
        // The create response doesn't include the sound itself — keep ours
        sound: rawNewPost?.sound ?? optimistic.sound ?? null,
        user: rawNewPost?.user || optimistic.user,
        likesCount: rawNewPost?.likesCount ?? 0,
        commentsCount: rawNewPost?.commentsCount ?? 0,
        sharesCount: rawNewPost?.sharesCount ?? 0,
        isLiked: false,
        giftCount: rawNewPost?.giftCount ?? 0,
        isBookmarked: false,
        createdAt: rawNewPost?.createdAt || optimistic.createdAt,
        isOptimistic: false,
      };
      DeviceEventEmitter.emit("NEW_POST_CONFIRMED", {
        tempId,
        post: confirmed,
      });
      showSuccess(
        t("explore.publishSuccessTitle"),
        t("explore.publishSuccessMsg"),
      );
    },
    // Replaces the hook's default toast, so only one error shows.
    onError: (error: any) => {
      console.error("Post publishing error:", error);
      showError(
        error?.response?.data?.message || t("explore.publishFailedDraftKept"),
        t("explore.publishErrorTitle"),
      );
    },
  });

  const buildOptimisticPost = (
    tempId: string,
    payload: CreatePostPayload,
    extra: Record<string, unknown>,
  ) => ({
    ...payload,
    ...extra,
    id: tempId,
    isOptimistic: true,
    user: {
      id: user?.id,
      username: user?.username,
      profilePictureUrl: user?.profilePictureUrl,
      profileFrame: user?.profileFrame,
      appLevel: user?.appLevel,
    },
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    isLiked: false,
    giftCount: 0,
    isBookmarked: false,
    createdAt: new Date().toISOString(),
  });

  /** Sound fields for the request, plus the sound itself for the optimistic post. */
  const soundFields = () =>
    soundSelection
      ? {
          payload: {
            soundId: soundSelection.sound.id,
            soundStartMs: soundSelection.startMs,
            soundVolume: soundSelection.soundVolume,
            originalVolume: soundSelection.originalVolume,
          },
          optimistic: { sound: soundSelection.sound },
        }
      : { payload: {}, optimistic: {} };

  const handlePublishPost = () => {
    if (!guardCreate("Creating new posts is disabled while your account is restricted.")) {
      return;
    }

    const formattedFiles = mediaList.map((media, index) => {
      const filename =
        media.uri.split("/").pop() || `upload_${Date.now()}_${index}`;
      const fileUri = media.uri;

      const extension = filename.split(".").pop()?.toLowerCase();
      let mimeType = media.type === "video" ? "video/mp4" : "image/jpeg";
      if (media.type === "image" && extension === "png") {
        mimeType = "image/png";
      }

      return {
        uri: fileUri,
        type: mimeType,
        name: filename,
        // Photos only — videos' filters go to the server via mediaFilters
        filterId: media.type === "image" ? media.filterId : undefined,
      };
    });

    const { mappedVisibility, mappedCommentPermission } =
      mapAudienceAndComment(audience, commentPrivacy);

    const payload: CreatePostPayload = {
      description: caption.trim(),
      category: formatEnum(category),
      visibility: mappedVisibility,
      commentPermission: mappedCommentPermission,
      giftsEnabled: allowGift,
      status: "published",
      taggedUserIds: taggedUsers.map((user) => user.id),
      hashtags: hashtags
        .map((tag) => tag.trim().replace(/^#/, "").replace(/\s+/g, ""))
        .filter((tag) => tag.length > 0),
      ...soundFields().payload,
      // One entry per file (same order): the filter the server bakes into each video
      ...(mediaList.some((m) => m.type === "video" && m.filterId)
        ? { mediaFilters: JSON.stringify(mediaList.map((m) => (m.type === "video" && m.filterId) || "")) }
        : {}),
    };

    const tempId = createOptimisticId("post");
    const optimisticPost = buildOptimisticPost(tempId, payload, {
      media: formattedFiles.map((file, index) => ({
        url: file.uri,
        type: file.type.startsWith("video") ? "video" : "image",
        // Local raw file: the feed shows it filtered until the server copy arrives
        filterId: mediaList[index]?.filterId,
      })),
      ...soundFields().optimistic,
    });

    // Fire-and-forget: the form clears now; a failure restores it.
    publishMutation.run({
      tempId,
      optimistic: optimisticPost,
      payload,
      files: formattedFiles,
      draft: snapshotDraft("media"),
    });

    // Leave immediately — the upload continues in the background.
    router.back();
  };

  const handleSelectPostType = () => {
    soundFromUseRef.current = false;
    setShowTypePicker(false);
  };

  const handleSelectTextPost = () => {
    soundFromUseRef.current = false;
    setShowTypePicker(false);
    setIsTextPostVisible(true);
  };

  // Leaving the picker (backdrop tap / hardware back) cancels creating.
  const handleCloseTypePicker = () => {
    if (soundFromUseRef.current) {
      soundFromUseRef.current = false;
      setSoundSelection(null);
    }
    setShowTypePicker(false);
    router.back();
  };

  // Publishes a pure-text post (no media), mirroring the story text flow but
  // carrying the same hashtags / tags / category / gift / privacy options as
  // a regular media post. `slides` is 1+ text cards (a carousel, same idea
  // as multiple media items on a media post) — see the comment on
  // CreatePostPayload.textSlides for why we still fill the legacy singular
  // fields too.
  const handlePublishTextPost = async (slides: TextPostSlide[]) => {
    if (!guardCreate("Creating new posts is disabled while your account is restricted.")) {
      return;
    }
    const { mappedVisibility, mappedCommentPermission } =
      mapAudienceAndComment(audience, commentPrivacy);
    const firstSlide = slides[0];

    const payload: CreatePostPayload = {
      description: firstSlide.text,
      category: category ? formatEnum(category) : undefined,
      visibility: mappedVisibility,
      commentPermission: mappedCommentPermission,
      giftsEnabled: allowGift,
      status: "published",
      taggedUserIds: taggedUsers.map((taggedUser) => taggedUser.id),
      hashtags: hashtags
        .map((tag) => tag.trim().replace(/^#/, "").replace(/\s+/g, ""))
        .filter((tag) => tag.length > 0),
      // Legacy singular fields (first slide) so a backend that doesn't yet
      // know about `textSlides` still renders something sensible.
      backgroundColor: firstSlide.backgroundColor,
      textAlign: firstSlide.textAlign,
      fontStyle: firstSlide.fontStyle,
      fontSize: firstSlide.fontSize,
      // Forward-compatible carousel payload: the full ordered slide list.
      textSlides: JSON.stringify(slides),
      ...soundFields().payload,
    };

    const tempId = createOptimisticId("post");
    // The server may not echo/persist `textSlides` yet — keep the composed
    // carousel so this post renders correctly the instant it hits the feed.
    const optimisticPost = buildOptimisticPost(tempId, payload, {
      textSlides: slides,
      ...soundFields().optimistic,
    });

    // Fire-and-forget: the composer closes now; a failure reopens it with
    // these slides.
    publishMutation.run({
      tempId,
      optimistic: optimisticPost,
      payload,
      files: [],
      draft: snapshotDraft("text", slides),
    });

    router.back();
  };

  // --- FULL SCREEN CAMERA VIEW ---
  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <Tabs.Screen
          options={{ tabBarStyle: { display: "none" }, headerShown: false }}
        />
        <CameraBackend
          ref={cameraRef}
          style={[
            StyleSheet.absoluteFill,
            aspectRatio === "4:3" ? styles.ratio43 : styles.ratio169,
          ]}
          facing={facing}
          mode={captureMode}
          isActive={isCameraOpen && !isSoundPickerOpen}
          filter={filtersAvailable ? filter.params : FILTER_BY_ID.original.params}
          flash={flash === "on"}
          zoom={zoomFactorFromSelector(zoom)}
          // With a sound, record without the mic — the video's audio is muted
          // anyway, and it avoids the mic fighting the speaker
          enableAudio={!soundSelection}
          onFiltersUnavailable={() => setFiltersAvailable(false)}
        />

        {/* No live shader here (Expo Go / live filters failed): approximate the look */}
        {!filtersAvailable && <FilterTintOverlay filter={filter.params} />}

        {/* Swipe left/right anywhere on the camera to change filter */}
        <View style={StyleSheet.absoluteFill} {...filterSwipe.panHandlers} />

        {/* Filter name flash */}
        {filterFlashName && (
          <Animated.View pointerEvents="none" style={[styles.filterNameWrap, { opacity: filterNameOpacity }]}>
            <Text style={styles.filterName}>{filterFlashName}</Text>
          </Animated.View>
        )}

        {/* Pick a sound before recording (TikTok-style) */}
        <View style={styles.soundPillWrap} pointerEvents="box-none">
          <TouchableOpacity
            disabled={isRecording}
            onPress={() => setIsSoundPickerOpen(true)}
            style={styles.soundPill}
          >
            <Ionicons name="musical-notes" size={16} color="#fff" />
            <Text numberOfLines={1} style={styles.soundPillText}>
              {soundSelection ? soundSelection.sound.title : "Add sound"}
            </Text>
            {soundSelection && !isRecording && (
              <TouchableOpacity onPress={() => setSoundSelection(null)} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
        <SoundPickerModal
          visible={isSoundPickerOpen}
          onClose={() => setIsSoundPickerOpen(false)}
          value={soundSelection}
          onChange={setSoundSelection}
        />

        {grid && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {[1, 2].map((i) => (
              <View
                key={`v${i}`}
                style={[styles.vertical, { left: `${i * 33.33}%` }]}
              />
            ))}
            {[1, 2].map((i) => (
              <View
                key={`h${i}`}
                style={[styles.horizontal, { top: `${i * 33.33}%` }]}
              />
            ))}
          </View>
        )}

        {hdrEnabled && (
          <View pointerEvents="none" style={styles.hdrActiveIndicator}>
            <Text style={styles.hdrText}>{t("explore.hdrActive")}</Text>
          </View>
        )}

        {countdown !== null && (
          <View style={styles.countdownContainer} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
          <View style={styles.headerRow}>
            <Pressable style={styles.closeButton} onPress={handleCloseCamera}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>

            {/* LIVE RECORDING BADGE WITH TIMER & PAUSE STATUS */}
            {isRecording && (
              <View style={styles.recordingBadge}>
                <View
                  style={[
                    styles.recordingDot,
                    isRecordingPaused && styles.recordingDotPaused,
                  ]}
                />
                <Text style={styles.recordingTimerText}>
                  {formatRecordingTime(recordingDuration)}
                </Text>
                <Text style={styles.recordingStatusText}>
                  {isRecordingPaused ? t("explore.recordingPaused") : t("explore.recording")}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>

        {!isRecording && (
          <SideControls
            flash={flash}
            timer={timer}
            grid={grid}
            filterActive={filterId !== "original"}
            onFlash={() => setFlash((f) => (f === "off" ? "on" : "off"))}
            onTimer={() => setTimer((t) => (t === 0 ? 3 : t === 3 ? 10 : 0))}
            onGrid={() => setGrid(!grid)}
            // The filter button opens the filter sheet
            onFilter={() => setIsFilterSheetOpen(true)}
            onHDR={() => setHdrEnabled(!hdrEnabled)}
            onAspectRatio={() =>
              setAspectRatio((prev) => (prev === "4:3" ? "16:9" : "4:3"))
            }
          />
        )}

        {/* PAUSE / RESUME ACTION BUTTON WHEN RECORDING */}
        {isRecording && (
          <View style={styles.pauseButtonContainer}>
            <TouchableOpacity
              style={styles.pauseButton}
              onPress={handlePauseResumeRecording}
            >
              <Ionicons
                name={isRecordingPaused ? "play" : "pause"}
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottom}>
          {!isRecording && <ZoomSelector zoom={zoom} onChange={setZoom} />}
          <BottomControls
            mode={cameraMode}
            onModeChange={setCameraMode}
            onCapture={handleCapture}
            onFlip={flipCamera}
            isRecording={isRecording}
            onGalleryPress={handleOpenGallery}
          />
        </View>

        {/* All filters, from the filter button — the camera stays live above it */}
        <FilterSheet
          visible={isFilterSheetOpen && !isRecording}
          onClose={() => setIsFilterSheetOpen(false)}
          filters={availableFilters}
          selectedId={filterId}
          onSelect={selectFilter}
          approximate={!filtersAvailable}
          videoMode={captureMode === "video"}
        />
      </View>
    );
  }

  // --- POST EDITING SCREEN ---
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {/* <CreatePostHeader onPost={handleOpenPreview} /> */}
      <AuthHeader title="Create Post" subtitle="Share your momemt" showBackButton={true} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <UserInfoCard />
        <CaptionInput value={caption} onChangeText={setCaption} />
        <MediaGrid
          media={mediaList}
          maxVisible={6}
          onRemove={handleRemoveMedia}
          onAddMore={handleOpenCamera}
          onPressItem={handlePressMediaItem}
        />
        <AddSoundRow
          selection={soundSelection}
          onPress={() => setIsSoundPickerOpen(true)}
          onRemove={() => setSoundSelection(null)}
        />
        <HashtagSection
          hashtags={hashtags}
          onAddHashtag={handleAddHashtag}
          onRemoveHashtag={handleRemoveHashtag}
        />
        <TagPeopleSection
          taggedUsers={taggedUsers}
          onPressRow={handleOpenTagModal}
        />
        <CategorySection category={category} onChange={setCategory} />
        <GiftSwitch enabled={allowGift} onValueChange={setAllowGift} />
        <PrivacySection
          audience={audience}
          commentPrivacy={commentPrivacy}
          onAudienceChange={setAudience}
          onCommentPrivacyChange={setCommentPrivacy}
        />

        <BottomActions
          onPreview={handleOpenPreview}
          onSaveDraft={() => handleSaveDraft("media")}
        />

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* --- ADD SOUND (media-post flow) --- */}
      <SoundPickerModal
        visible={isSoundPickerOpen && !isTextPostVisible}
        onClose={() => setIsSoundPickerOpen(false)}
        value={soundSelection}
        onChange={setSoundSelection}
      />

      {/* --- TAG PEOPLE MODAL (media-post flow: not nested inside another modal) --- */}
      <TagPeopleModal
        visible={isTagModalOpen && !isTextPostVisible}
        onClose={handleCloseTagModal}
        tagListMode={tagListMode}
        onTagListModeChange={setTagListMode}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        debouncedSearchQuery={debouncedSearchQuery}
        taggedUsers={taggedUsers}
        isLoadingUsers={isLoadingUsers}
        isLoadingMoreUsers={isLoadingMoreUsers}
        availableUsers={availableUsers}
        usersCursor={usersCursor}
        onLoadMore={() => fetchTagUsers(false)}
        onToggleUser={toggleTaggedUser}
      />

      {/* --- PREVIEW MODAL --- */}
      <Modal
        statusBarTranslucent={false}
        visible={isPreviewOpen}
        animationType="slide"
        onRequestClose={() => setIsPreviewOpen(false)}
        presentationStyle="overFullScreen"
      >
        <StatusBar
          barStyle={
            colors.background === "#fff" ? "dark-content" : "light-content"
          }
          backgroundColor="transparent"
          translucent={true}
        />
        <SafeAreaView
          style={[
            styles.safeArea,
            { paddingTop: insets.top, backgroundColor: colors.background },
          ]}
          edges={["top", "bottom"]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setIsPreviewOpen(false)}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>{t("explore.postPreview")}</ThemedText>
            <View style={styles.headerButton} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <ThemedText style={styles.sectionLabel}>{t("explore.feedPreview")}</ThemedText>

            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <ProfileFrame
                  frameId={user?.profileFrame}
                  uri={user?.profilePictureUrl}
                  size={42}
                  initial={(user?.firstName?.[0] || user?.lastName?.[0] || user?.username?.[0] || "")?.toUpperCase()}
                  fallbackColor={colors.primary}
                />
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName}>
                    {user?.username}
                  </ThemedText>
                  <LevelBadge level={user?.appLevel} />
                </View>
              </View>

              <View style={styles.textContainer}>
                {caption.trim().length > 0 && (
                  <ThemedText style={styles.captionText}>{caption}</ThemedText>
                )}

                {/* Enhanced Hashtag Rendering */}
                {hashtags.length > 0 && (
                  <View style={styles.hashtagRow}>
                    {hashtags.map((tag, idx) => {
                      // Ensure we don't accidentally double-render a '#' symbol if the user typed it
                      const cleanTag = tag.trim().replace(/^#/, "");
                      if (!cleanTag) return null;
                      return (
                        <ThemedText key={idx} style={styles.hashtagText}>
                          #{cleanTag}{" "}
                        </ThemedText>
                      );
                    })}
                  </View>
                )}
              </View>

              {mediaList.length > 0 && (
                <View style={styles.previewGridContainer}>
                  <MediaGrid
                    media={mediaList}
                    maxVisible={6}
                    isPreview={true}
                    onPressItem={handlePressMediaItem}
                  />
                </View>
              )}

              <View
                style={[
                  styles.engagementBar,
                  { borderTopColor: colors.border },
                ]}
              >
                <View style={styles.engagementGroup}>
                  <Ionicons name="heart-outline" size={24} color="#EF4444" />
                  <ThemedText style={styles.engagementCount}>0</ThemedText>
                </View>
                <View style={styles.engagementGroup}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={22}
                    color="#6B7280"
                  />
                  <ThemedText style={styles.engagementCount}>0</ThemedText>
                </View>
                <View style={styles.engagementGroup}>
                  <Ionicons
                    name="share-social-outline"
                    size={22}
                    color="#6B7280"
                  />
                </View>
                {allowGift && (
                  <View style={styles.giftIconGroup}>
                    <Ionicons name="gift-outline" size={22} color="#F59E0B" />
                  </View>
                )}
              </View>
            </View>

            <ThemedText style={styles.sectionLabel}>
              {t("explore.privacyDistribution")}
            </ThemedText>

            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: colors.border + "30",
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryLeft}>
                  <Ionicons
                    name={
                      audience === "public"
                        ? "earth-outline"
                        : audience === "friends"
                          ? "people-outline"
                          : "lock-closed-outline"
                    }
                    size={20}
                    color="#3B82F6"
                  />
                  <ThemedText style={styles.summaryLabel}>
                    {t("explore.whoCanSee")}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText>
                    {audience === "public" ? t("explore.public") : audience === "friends" ? t("explore.friends") : t("explore.schoolOnly")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryLeft}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={19}
                    color="#10B981"
                  />
                  <ThemedText style={styles.summaryLabel}>
                    {t("explore.whoCanComment")}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText>
                    {commentPrivacy === "everyone" ? t("explore.everyone") : t("explore.nobody")}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryLeft}>
                  <Ionicons name="pricetag-outline" size={19} color="#EC4899" />
                  <ThemedText style={styles.summaryLabel}>{t("explore.categoryLabel")}</ThemedText>
                </View>
                <View>
                  <ThemedText>
                    {category
                      ? `${category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`
                      : t("explore.categoryNone")}
                  </ThemedText>
                </View>
              </View>

              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <View style={styles.summaryLeft}>
                  <Ionicons name="gift-outline" size={20} color="#7C3AED" />
                  <ThemedText style={styles.summaryLabel}>
                    {t("explore.giftsTipping")}
                  </ThemedText>
                </View>
                <View>
                  <ThemedText
                    style={{ color: allowGift ? "#10B981" : "#EF4444" }}
                  >
                    {allowGift ? t("explore.allowed") : t("explore.disabled")}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>

          {isRestricted && (
            <View style={{ marginHorizontal: 16, marginBottom: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.dangerLight }}>
              <ThemedText style={{ fontSize: 12, fontWeight: "600", textAlign: "center", color: colors.danger }}>
                Creating new posts is disabled while your account is restricted
              </ThemedText>
            </View>
          )}

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.btnSecondary,
                { borderColor: colors.border },
                isProcessing && { opacity: 0.5 }, // Dim button when loading
              ]}
              onPress={() => setIsPreviewOpen(false)}
              disabled={isProcessing} // Prevent user from leaving mid-upload
            >
              <ThemedText
                style={[styles.btnSecondaryText, { color: colors.text }]}
              >
                {t("explore.editPost")}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: colors.border }]}
              onPress={() => handleSaveDraft("media")}
            >
              <ThemedText
                style={[styles.btnSecondaryText, { color: colors.text }]}
              >
                {t("explore.saveDraft")}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnPrimary,
                isProcessing && { opacity: 0.8, flexDirection: "row", gap: 8 }, // Center alignment helper
                isRestricted && { opacity: 0.5 },
              ]}
              onPress={handlePublishPost}
              disabled={isProcessing || isRestricted}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <ThemedText style={styles.btnPrimaryText}>
                    {t("explore.publishing")}
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={styles.btnPrimaryText}>
                  {t("explore.publishNow")}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* --- MEDIA PREVIEW MODAL (play videos; choose a filter after capture) --- */}
      <Modal
        visible={!!previewItem}
        animationType="fade"
        transparent={true}
        onRequestClose={closeMediaPreview}
      >
        <View style={styles.modalBackground}>
          <View
            style={[styles.modalSafeArea, { paddingTop: STATUS_BAR_HEIGHT }]}
          >
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalCloseButton}
                onPress={closeMediaPreview}
              >
                <Ionicons name="close" size={26} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={styles.videoContainer}>
              {previewItem?.type === "image" ? (
                previewFilter ? (
                  <FilteredImage uri={previewItem.uri} filter={previewFilter.params} style={StyleSheet.absoluteFill} />
                ) : (
                  <Image source={{ uri: previewItem.uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
                )
              ) : activeVideoUri && activeVideoFilter ? (
                // Plays with the filter the server will apply on upload
                isVideoPlaying && (
                  <FilteredVideoPreview uri={activeVideoUri} filter={activeVideoFilter.params} muted={!!soundSelection} />
                )
              ) : activeVideoUri ? (
                <VideoView
                  player={videoPlayer}
                  style={styles.fullScreenVideo}
                />
              ) : null}

              {!isVideoPlaying && activeVideoUri && (
                <View style={StyleSheet.absoluteFill}>
                  {activeVideoThumbnail && activeVideoFilter ? (
                    <FilteredImage
                      uri={activeVideoThumbnail}
                      filter={activeVideoFilter.params}
                      style={StyleSheet.absoluteFill}
                    />
                  ) : activeVideoThumbnail ? (
                    <Image
                      source={{ uri: activeVideoThumbnail }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: "#000" },
                      ]}
                    />
                  )}
                  <View style={styles.playOverlay}>
                    <Pressable
                      style={styles.playButton}
                      onPress={handlePlayVideo}
                    >
                      <Ionicons
                        name="play"
                        size={40}
                        color="#FFFFFF"
                        style={{ marginLeft: 6 }}
                      />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Filters after capture — not for media already filtered live by the camera */}
            {previewItem && !previewItem.liveFiltered && (
              <View style={styles.previewFilterStrip}>
                <FilterStrip
                  filters={filtersFor(previewItem.type === "video" ? "video" : "photo")}
                  selectedId={previewItem.filterId ?? "original"}
                  onSelect={(f) => setMediaFilter(previewItem.id, f.id)}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- CREATE TYPE PICKER (POST / TEXT) --- */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={handleCloseTypePicker}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={handleCloseTypePicker}
        >
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <ThemedText style={styles.pickerTitle}>Create Post</ThemedText>

            {/* The sound picked with "Use this sound" — used by either option */}
            {soundSelection && (
              <View style={styles.pickerSoundPill}>
                <Ionicons name="musical-notes" size={16} color={colors.primary} />
                <ThemedText numberOfLines={1} style={styles.pickerSoundText}>
                  {soundSelection.sound.title} · {soundSelection.sound.artistName}
                </ThemedText>
              </View>
            )}

            <View style={styles.pickerOptionsRow}>
              <TouchableOpacity
                style={styles.pickerOptionCard}
                onPress={handleSelectPostType}
              >
                <View
                  style={[
                    styles.pickerIconWrapper,
                    { backgroundColor: "#eff6ff" },
                  ]}
                >
                  <Ionicons name="images" size={28} color="#3b82f6" />
                </View>
                <ThemedText style={styles.pickerOptionLabel}>Post</ThemedText>
                <ThemedText style={styles.pickerOptionHint}>
                  Photo & video
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pickerOptionCard}
                onPress={handleSelectTextPost}
              >
                <View
                  style={[
                    styles.pickerIconWrapper,
                    { backgroundColor: "#f5f3ff" },
                  ]}
                >
                  <Ionicons name="text" size={28} color="#7c3aed" />
                </View>
                <ThemedText style={styles.pickerOptionLabel}>Text</ThemedText>
                <ThemedText style={styles.pickerOptionHint}>
                  Share your thoughts
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* --- FULLSCREEN TEXT POST COMPOSER (mirrors the story text composer) --- */}
      <TextPostComposer
        visible={isTextPostVisible}
        initialSlides={textDraftSlides}
        onClose={() => setIsTextPostVisible(false)}
        onPublish={handlePublishTextPost}
        onSaveDraft={(slides) => handleSaveDraft("text", slides)}
        hashtags={hashtags}
        onAddHashtag={handleAddHashtag}
        onRemoveHashtag={handleRemoveHashtag}
        taggedUsers={taggedUsers}
        category={category}
        onCategoryChange={setCategory}
        allowGift={allowGift}
        onAllowGiftChange={setAllowGift}
        audience={audience}
        onAudienceChange={setAudience}
        commentPrivacy={commentPrivacy}
        onCommentPrivacyChange={setCommentPrivacy}
        onTagPickerOpen={handleOpenTagModal}
        soundSelection={soundSelection}
        onSoundChange={setSoundSelection}
        onTagPickerClose={handleCloseTagModal}
        tagListMode={tagListMode}
        onTagListModeChange={setTagListMode}
        tagSearchQuery={searchQuery}
        onTagSearchQueryChange={setSearchQuery}
        debouncedTagSearchQuery={debouncedSearchQuery}
        isLoadingTagUsers={isLoadingUsers}
        isLoadingMoreTagUsers={isLoadingMoreUsers}
        availableTagUsers={availableUsers}
        tagUsersCursor={usersCursor}
        onLoadMoreTagUsers={() => fetchTagUsers(false)}
        onToggleTaggedUser={toggleTaggedUser}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewFilterStrip: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
  },
  filterNameWrap: {
    position: "absolute",
    top: height * 0.4,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  filterName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  soundPillWrap: {
    position: "absolute",
    top: STATUS_BAR_HEIGHT + 64,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  soundPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "70%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  soundPillText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    flexShrink: 1,
  },
  safeArea: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  ratio43: {
    height: (width * 4) / 3,
    top: (height - (width * 4) / 3) / 2,
  },
  ratio169: {
    height: "100%",
    width: "100%",
  },
  filterGoldenHourOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255, 170, 0, 0.15)",
    zIndex: 1,
  },
  hdrActiveIndicator: {
    position: "absolute",
    top: STATUS_BAR_HEIGHT + 60,
    alignSelf: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  hdrText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 10,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },
  recordingDotPaused: {
    backgroundColor: "#F59E0B",
  },
  recordingTimerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  recordingStatusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 6,
    opacity: 0.8,
  },
  pauseButtonContainer: {
    position: "absolute",
    bottom: "7%",
    alignSelf: "flex-start",
    zIndex: 20,
    left: "10%",
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  bottom: {
    position: "absolute",
    bottom: 20,
    width: "100%",
  },
  vertical: {
    position: "absolute",
    width: 1,
    backgroundColor: "rgba(255,255,255,.3)",
    top: 0,
    bottom: 0,
  },
  horizontal: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(255,255,255,.3)",
    left: 0,
    right: 0,
  },
  countdownContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 15,
  },
  countdownText: {
    fontSize: 110,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.98)",
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 20,
  },
  modalCloseButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  fullScreenVideo: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000",
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    height: 56,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
  },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  categoryPill: {
    backgroundColor: "#7C3AED18",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7C3AED",
  },
  textContainer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  captionText: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 4,
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
  hashtagText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  previewGridContainer: {
    marginBottom: 10,
  },
  engagementBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  engagementGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  engagementCount: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  giftIconGroup: {
    marginLeft: "auto",
  },
  summaryBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F01A",
  },
  summaryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryLabel: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
  },
  btnSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  btnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  modalHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  modalCloseButtonSmall: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    minHeight: 40,
  },
  modalSummary: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  modalSummaryText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  tagModeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    columnGap: 10,
  },
  tagModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  tagModeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  taggedRow: {
    flexDirection: "row",
  },
  taggedUserPill: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  taggedUserPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  tagModalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tagModalList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyStateContainer: {
    padding: 28,
    alignItems: "center",
  },
  tagUserRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tagUserLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagUserAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D1D5DB",
  },
  tagUserName: {
    fontSize: 15,
    fontWeight: "700",
  },
  tagUserHandle: {
    fontSize: 13,
    color: "#6B7280",
  },
  tagSelectIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  placementContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  placementOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  placementTextContainer: {
    flex: 1,
  },
  placementTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  placementSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },

  /* --- Create type picker (Post / Text) --- */
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: "center",
  },
  pickerHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 24,
  },
  pickerSoundPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    maxWidth: "90%",
    marginTop: -12,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  pickerSoundText: {
    color: "#1f2937",
    fontWeight: "700",
    fontSize: 13,
    flexShrink: 1,
  },
  pickerOptionsRow: {
    flexDirection: "row",
    gap: 20,
    width: "100%",
  },
  pickerOptionCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#f3f4f6",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  pickerIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerOptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  pickerOptionHint: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9ca3af",
    marginTop: -6,
  },
});