import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
  Platform,
  StatusBar,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Tabs } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";

// UI Components
import CameraHeader from "@/components/camera/cameraHeader";
import SideControls from "@/components/camera/sideControls";
import ZoomSelector from "@/components/camera/zoomSelector";
import BottomControls from "@/components/camera/bottomControls";
import {
  CameraBackend,
  LIVE_FILTERS,
  useCameraAccess,
  useMicrophoneAccess,
} from "@/components/camera/cameraBackend";
import { zoomFactorFromSelector, type FilterCameraHandle } from "@/components/camera/cameraTypes";
import FilterStrip from "@/components/camera/filterStrip";
import FilterTintOverlay from "@/components/camera/filterTintOverlay";
import FilterSheet from "@/components/camera/filterSheet";
import FilteredVideoPreview from "@/components/camera/filteredVideoPreview";
import FilteredImage from "@/components/camera/filteredImage";
import { bakePhotoFilter } from "@/utils/bakePhotoFilter";
import { FILTER_BY_ID, filtersFor, type CameraFilter } from "@/constants/cameraFilters";
import {
  publishStoryInBackground,
  useStoryDraftStore,
} from "@/store/storyDraftStore";
import { usePendingSoundStore } from "@/store/pendingSoundStore";
import { IMAGE_QUALITY } from "@/constants/mediaQuality";
import { compressForUpload } from "@/utils/compressMedia";
import { appendUploadFile } from "@/utils/uploadFile";
import { useCreateRestriction } from "@/hooks/useCreateRestriction";
import { useSoundPlayback } from "@/hooks/useSoundPlayback";
import { SOUND_CLIP_MS, appendSound, soundFieldsOf, type SoundSelection } from "@/service/sound.service";
import AddSoundRow from "@/components/sound/addSoundRow";
import SoundPickerModal from "@/components/sound/soundPickerModal";
import { ThemedText } from "@/components/ui/ThemedText";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const STATUS_BAR_HEIGHT =
  Platform.OS === "ios"
    ? height >= 812
      ? 47
      : 20
    : StatusBar.currentHeight || 0;

/** Horizontal swipe distance that switches to the next/previous filter */
const SWIPE_THRESHOLD = 60;

type CapturedMedia = {
  uri: string;
  type: "photo" | "video";
  /**
   * Filter to apply: videos → by the server on upload; photos → baked on the
   * phone at publish. Live-filtered photos already have it in the pixels.
   */
  filterId?: string;
  /** Filtered while filming (live filter camera) — no after-capture filter picker */
  liveFiltered?: boolean;
};

// Autoplaying loop preview of the recorded/selected video clip.
function VideoPreviewPlayer({ uri, volume = 1 }: { uri: string; volume?: number }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.play();
  });

  // The clip's own audio sits under a chosen sound
  useEffect(() => {
    try {
      player.volume = volume;
    } catch {
      // released
    }
  }, [player, volume]);

  return (
    <VideoView
      player={player}
      style={styles.absoluteFillCustom}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function CameraScreen() {
  const cameraRef = useRef<FilterCameraHandle>(null);

  // Permissions
  const camPermission = useCameraAccess();
  const micPermission = useMicrophoneAccess();

  // Camera Settings
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [zoom, setZoom] = useState(0.15);
  const [mode, setMode] = useState("PHOTO");
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [grid, setGrid] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"4:3" | "16:9">("4:3");
  const [isRecording, setIsRecording] = useState(false);

  // Filters are picked before capture. Development/production builds render them
  // live; Expo Go shows an approximate tint and applies the real one to the capture.
  const [filterId, setFilterId] = useState("original");
  const [filtersAvailable, setFiltersAvailable] = useState(LIVE_FILTERS);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const captureMode: "photo" | "video" = mode === "VIDEO" ? "video" : "photo";
  const availableFilters = useMemo(() => filtersFor(captureMode), [captureMode]);
  const filter: CameraFilter = FILTER_BY_ID[filterId] ?? FILTER_BY_ID.original;

  // Photo-only filters (colour tints) can't be applied to video — reset when switching
  useEffect(() => {
    if (!availableFilters.some((f) => f.id === filterId)) setFilterId("original");
  }, [availableFilters, filterId]);

  // Filter name flashes in the middle when it changes (TikTok-style)
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const [flashName, setFlashName] = useState<string | null>(null);
  const selectFilter = (next: CameraFilter) => {
    setFilterId(next.id);
    setFlashName(next.name);
    nameOpacity.stopAnimation();
    nameOpacity.setValue(1);
    Animated.timing(nameOpacity, { toValue: 0, duration: 900, delay: 500, useNativeDriver: true }).start();
  };

  // Swipe left/right on the camera to change filter
  const swipeState = useRef({ filters: availableFilters, filterId, recording: isRecording });
  swipeState.current = { filters: availableFilters, filterId, recording: isRecording };
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        const { filters, filterId: current, recording } = swipeState.current;
        if (recording || Math.abs(g.dx) < SWIPE_THRESHOLD) return;
        const index = Math.max(0, filters.findIndex((f) => f.id === current));
        const nextIndex = g.dx < 0 ? Math.min(filters.length - 1, index + 1) : Math.max(0, index - 1);
        if (nextIndex !== index) selectFilter(filters[nextIndex]);
      },
    }),
  ).current;

  // Video Duration Counter
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Preview & Story Upload State
  // Opened from "Use this sound" on a post/story: start on the camera with it picked
  const [pendingSound] = useState(() => {
    const { pending } = usePendingSoundStore.getState();
    return pending?.target === "story" ? pending.selection : null;
  });

  // Opened to retry a story whose upload failed: start on its preview.
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(
    () => {
      if (pendingSound) return null;
      const { failedDraft } = useStoryDraftStore.getState();
      return failedDraft?.kind === "media" ? failedDraft.media : null;
    },
  );

  // The draft / sound is on screen now, so it no longer needs to be held.
  useEffect(() => {
    if (pendingSound) {
      usePendingSoundStore.getState().consume("story");
      return;
    }
    const { failedDraft, clearFailedDraft } = useStoryDraftStore.getState();
    if (failedDraft?.kind === "media") clearFailedDraft();
  }, [pendingSound]);
  const [caption, setCaption] = useState("");

  // Sound played with the story (restored too when retrying a failed upload)
  const [soundSelection, setSoundSelection] = useState<SoundSelection | null>(() => {
    if (pendingSound) return pendingSound;
    const { failedDraft } = useStoryDraftStore.getState();
    return failedDraft?.kind === "media" ? failedDraft.sound ?? null : null;
  });
  const [isSoundPickerOpen, setIsSoundPickerOpen] = useState(false);
  const [recordingSession, setRecordingSession] = useState(0);
  // One player for the whole flow, loaded ahead so it starts the instant
  // recording does: silent in the viewfinder, playing while recording (so the
  // user can perform to it) and over the preview, as viewers will hear it.
  // Each new recording, and entering the preview, restarts the clip.
  useSoundPlayback(soundSelection, !isSoundPickerOpen, {
    ignoreMute: true,
    paused: !capturedMedia && !isRecording,
    restartKey: recordingSession * 2 + (capturedMedia ? 1 : 0),
  });

  useEffect(() => {
    if (!camPermission.hasPermission && camPermission.canRequestPermission) camPermission.requestPermission();
    if (!micPermission.hasPermission && micPermission.canRequestPermission) micPermission.requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camPermission.hasPermission, micPermission.hasPermission]);

  // Video Recording Timer Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      setRecordingDuration(0);
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  // Format seconds to MM:SS display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Gallery Picker
  async function handleOpenGallery() {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Gallery access is required to select media.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        // Smaller uploads: photos re-saved at 80%, videos exported at 720p (iOS);
        // anything still too big is compressed before upload (utils/compressMedia)
        quality: IMAGE_QUALITY,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Gallery media can be filtered on the preview screen
        setCapturedMedia({
          uri: asset.uri,
          type: asset.type === "video" ? "video" : "photo",
          filterId: "original",
          liveFiltered: false,
        });
      }
    } catch (error) {
      console.error("Error opening gallery:", error);
    }
  }

  // Timer execution wrapper
  async function handleCapture() {
    if (!cameraRef.current) return;

    // If timer is set and not currently recording a video, start countdown
    if (timer > 0 && !isRecording && countdown === null) {
      let currentCount = timer;
      setCountdown(currentCount);

      const interval = setInterval(() => {
        currentCount -= 1;
        if (currentCount > 0) {
          setCountdown(currentCount);
        } else {
          clearInterval(interval);
          setCountdown(null);
          executeCapture(); // Trigger capture once timer reaches 0
        }
      }, 1000);
    } else {
      executeCapture();
    }
  }

  // Perform actual photo or video capture
  async function executeCapture() {
    const camera = cameraRef.current;
    if (!camera) return;

    if (mode === "PHOTO") {
      try {
        const uri = await camera.takePhoto();
        // With live filters the photo already has its filter; otherwise the filter
        // picked on the camera is applied at publish (and can still be changed on the preview)
        setCapturedMedia(
          filtersAvailable
            ? { uri, type: "photo", liveFiltered: true }
            : { uri, type: "photo", filterId, liveFiltered: false },
        );
      } catch (e) {
        console.error("Failed to take photo:", e);
        Alert.alert("Couldn't take the photo", "Please try again.");
      }
    } else if (mode === "VIDEO") {
      if (isRecording) {
        try {
          await camera.stopRecording();
        } catch (e) {
          console.error("Failed to stop recording:", e);
        }
      } else {
        // The filter picked on the camera — applied on upload (video frames are recorded raw)
        const recordedFilter = filterId;
        try {
          setIsRecording(true);
          // Start the chosen sound from its clip start, in time with the video
          setRecordingSession((n) => n + 1);
          await camera.startRecording({
            // With a sound, the video is as long as the clip at most
            maxDuration: soundSelection ? SOUND_CLIP_MS / 1000 : 60,
            onFinished: (uri) => {
              setIsRecording(false);
              setCapturedMedia({ uri, type: "video", filterId: recordedFilter, liveFiltered: filtersAvailable });
            },
            onError: (error) => {
              console.error("Recording failed:", error);
              setIsRecording(false);
              Alert.alert("Recording failed", "Please try again.");
            },
          });
        } catch (e) {
          console.error("Failed to record video:", e);
          setIsRecording(false);
        }
      }
    }
  }

  const [hdrEnabled, setHdrEnabled] = useState(false);
  const { isRestricted, guardCreate } = useCreateRestriction();

  // Publish Story Handler — optimistic: the story shows in the home rail and
  // this screen closes right away; the upload runs in the background. If it
  // fails, the draft is kept and tapping "Your story" reopens it here.
  async function handlePublishStory() {
    if (!capturedMedia) return;
    if (!guardCreate("Sharing stories is disabled while your account is restricted.")) {
      return;
    }

    // Photos filtered after capture: bake the filter in before upload
    let sourceUri = capturedMedia.uri;
    if (capturedMedia.type === "photo" && capturedMedia.filterId && capturedMedia.filterId !== "original") {
      try {
        sourceUri = await bakePhotoFilter(capturedMedia.uri, capturedMedia.filterId);
      } catch (e) {
        console.error("Failed to apply photo filter:", e);
        Alert.alert("Couldn't apply the filter", "Your photo will be shared without it.");
      }
    }

    const media = capturedMedia;
    const sound = soundSelection;

    // Built after the screen closes: compressing a video takes a few seconds
    const buildForm = async () => {
      // Shrink to upload size (720p video / resized photo) — original if that fails
      let uri = await compressForUpload(sourceUri, media.type);

      // Clean iOS file path if needed
      if (Platform.OS === "ios") {
        uri = uri.replace("file://", "");
      }

      // Extract file extension and determine correct MIME type
      const filename = uri.split("/").pop() || `story_${Date.now()}`;
      const match = /\.(\w+)$/.exec(filename);
      const ext = match
        ? match[1].toLowerCase()
        : media.type === "video"
          ? "mp4"
          : "jpeg";

      const mimeType =
        media.type === "video"
          ? `video/${ext === "mov" ? "quicktime" : ext}`
          : `image/${ext === "jpg" ? "jpeg" : ext}`;

      const formData = new FormData();

      // 1. MUST BE 'media' to match FileInterceptor('media') in NestJS
      // (works on phones and web — browsers need the file data, not just a uri)
      await appendUploadFile(formData, "media", {
        uri,
        name: `${Date.now()}.${ext}`,
        type: mimeType,
      });
      appendSound(formData, sound);
      // Videos are recorded raw: the server applies the chosen filter on upload
      if (media.type === "video" && media.filterId && media.filterId !== "original") {
        formData.append("filter", media.filterId);
      }
      return formData;
    };

    publishStoryInBackground({
      formData: buildForm,
      story: {
        type: capturedMedia.type === "video" ? "video" : "image",
        mediaUrl: sourceUri,
        timestamp: "now",
        ...soundFieldsOf(soundSelection),
      },
      draft: { kind: "media", media: capturedMedia, sound: soundSelection },
      successMessage: "Your story is live for 24 hours.",
      errorMessage:
        "Your story couldn't be uploaded. It's saved — tap Your Story to try again.",
    });

    resetPreviewState();
    setSoundSelection(null);
    router.replace("/(tabs)");
  }

  // Retake keeps the chosen sound (record again to the same song)
  function resetPreviewState() {
    setCapturedMedia(null);
    setCaption("");
  }

  function flipCamera() {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  if (!camPermission.hasPermission || !micPermission.hasPermission) {
    const blocked =
      (!camPermission.hasPermission && !camPermission.canRequestPermission) ||
      (!micPermission.hasPermission && !micPermission.canRequestPermission);
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <ThemedText style={styles.permissionText}>
          {blocked
            ? "Camera and Microphone access are turned off for 3NAMES. Turn them on in your phone's Settings to record stories."
            : "Camera and Microphone permissions are required to record stories."}
        </ThemedText>
        {!blocked && (
          <TouchableOpacity
            onPress={() => {
              if (!camPermission.hasPermission) camPermission.requestPermission();
              if (!micPermission.hasPermission) micPermission.requestPermission();
            }}
            style={styles.permissionBtn}
          >
            <ThemedText style={styles.permissionBtnText}>Grant Permissions</ThemedText>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  const previewFilter = capturedMedia?.filterId ? FILTER_BY_ID[capturedMedia.filterId] : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <Tabs.Screen
        options={{ tabBarStyle: { display: "none" }, headerShown: false }}
      />

      {/* MEDIA PREVIEW OVERLAY */}
      {capturedMedia ? (
        <View style={StyleSheet.absoluteFill}>
          {capturedMedia.type === "photo" && previewFilter && previewFilter.id !== "original" ? (
            <FilteredImage
              uri={capturedMedia.uri}
              filter={previewFilter.params}
              style={styles.absoluteFillCustom}
            />
          ) : capturedMedia.type === "photo" ? (
            <Image
              source={{ uri: capturedMedia.uri }}
              style={styles.absoluteFillCustom}
            />
          ) : previewFilter && previewFilter.id !== "original" ? (
            // Shows the video as viewers will see it once the server applies the filter
            <FilteredVideoPreview
              uri={capturedMedia.uri}
              filter={previewFilter.params}
              paused={isSoundPickerOpen}
              muted={!!soundSelection}
            />
          ) : (
            <VideoPreviewPlayer
              uri={capturedMedia.uri}
              // With a sound, only the sound plays — the clip's own audio is muted
              volume={soundSelection ? 0 : 1}
            />
          )}

          {/* Top Controls: Retake Action */}
          <SafeAreaView style={styles.previewHeader}>
            <TouchableOpacity
              onPress={resetPreviewState}
              style={styles.iconCircleBtn}
            >
              <ThemedText style={styles.btnText}>✕</ThemedText>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Filters after capture (Expo Go, gallery picks) — videos only get video-safe ones */}
          {!capturedMedia.liveFiltered && (
            <View style={styles.previewFilterStrip}>
              <FilterStrip
                filters={filtersFor(capturedMedia.type === "video" ? "video" : "photo")}
                selectedId={capturedMedia.filterId ?? "original"}
                onSelect={(f) => setCapturedMedia((m) => (m ? { ...m, filterId: f.id } : m))}
              />
            </View>
          )}

          {/* Bottom Controls: Caption Input + Publish Button */}
          <SafeAreaView style={styles.previewFooter}>
            {isRestricted && (
              <ThemedText
                style={{
                  color: "#FCA5A5",
                  fontSize: 12,
                  fontWeight: "600",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Sharing stories is disabled while your account is restricted
              </ThemedText>
            )}
            <AddSoundRow
              tone="onDark"
              selection={soundSelection}
              onPress={() => setIsSoundPickerOpen(true)}
              onRemove={() => setSoundSelection(null)}
            />
            {/* Publishing is instant (uploads in the background), so no
                loading state is needed here. */}
            <TouchableOpacity
              style={[styles.publishButton, isRestricted && { opacity: 0.6 }]}
              disabled={isRestricted}
              onPress={handlePublishStory}
            >
              <ThemedText style={styles.publishBtnText}>
                Share Story
              </ThemedText>
              <Ionicons name="send" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      ) : (
        /* CAMERA VIEW ROUTE */
        <>
          <CameraBackend
            ref={cameraRef}
            style={[
              StyleSheet.absoluteFill,
              aspectRatio === "4:3" ? styles.ratio43 : styles.ratio169,
            ]}
            facing={facing}
            mode={captureMode}
            isActive={!capturedMedia && !isSoundPickerOpen}
            filter={filtersAvailable ? filter.params : FILTER_BY_ID.original.params}
            flash={flash === "on"}
            zoom={zoomFactorFromSelector(zoom)}
            // With a sound, record without the mic — the video's audio is
            // muted anyway, and it avoids the mic fighting the speaker
            enableAudio={!soundSelection}
            onFiltersUnavailable={() => setFiltersAvailable(false)}
          />

          {/* No live shader here (Expo Go / live filters failed): approximate the look */}
          {!filtersAvailable && <FilterTintOverlay filter={filter.params} />}

          {/* Swipe left/right anywhere on the camera to change filter */}
          <View style={StyleSheet.absoluteFill} {...swipe.panHandlers} />

          {/* Filter name flash */}
          {flashName && (
            <Animated.View pointerEvents="none" style={[styles.filterNameWrap, { opacity: nameOpacity }]}>
              <ThemedText style={styles.filterName}>{flashName}</ThemedText>
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
              <ThemedText numberOfLines={1} style={styles.soundPillText}>
                {soundSelection ? soundSelection.sound.title : "Add sound"}
              </ThemedText>
              {soundSelection && !isRecording && (
                <TouchableOpacity onPress={() => setSoundSelection(null)} hitSlop={10}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* TIMER COUNTDOWN DISPLAY */}
          {countdown !== null && (
            <View style={styles.countdownOverlay} pointerEvents="none">
              <ThemedText style={styles.countdownText}>{countdown}</ThemedText>
            </View>
          )}

          {/* RECORDING TIMER OVERLAY */}
          {isRecording && (
            <SafeAreaView
              style={styles.recordingTimerContainer}
              pointerEvents="none"
            >
              <View style={styles.timerBadge}>
                <View style={styles.recordingDot} />
                <ThemedText style={styles.timerText}>
                  {formatTime(recordingDuration)}
                </ThemedText>
              </View>
            </SafeAreaView>
          )}

          {/* Grid View */}
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
              <ThemedText style={styles.hdrText}>HDR ACTIVE</ThemedText>
            </View>
          )}

          {!isRecording && <CameraHeader />}

          {!isRecording && (
            <SideControls
              flash={flash as any}
              timer={timer}
              grid={grid}
              onFlash={() => setFlash((f) => (f === "off" ? "on" : "off"))}
              onTimer={() => setTimer((t) => (t === 0 ? 3 : t === 3 ? 10 : 0))}
              onGrid={() => setGrid(!grid)}
              onAspectRatio={() =>
                setAspectRatio((prev) => (prev === "4:3" ? "16:9" : "4:3"))
              }
              filterActive={filterId !== "original"}
              // The filter button opens the filter sheet
              onFilter={() => setIsFilterSheetOpen(true)}
              onHDR={() => setHdrEnabled(!hdrEnabled)}
            />
          )}

          <View style={styles.bottom}>
            {!isRecording && <ZoomSelector zoom={zoom} onChange={setZoom} />}

            <BottomControls
              mode={mode}
              onModeChange={setMode}
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
        </>
      )}

      {/* Opened from the camera (before recording) or the preview */}
      <SoundPickerModal
        visible={isSoundPickerOpen}
        onClose={() => setIsSoundPickerOpen(false)}
        value={soundSelection}
        onChange={setSoundSelection}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
  previewFilterStrip: {
    position: "absolute",
    bottom: 140,
    left: 0,
    right: 0,
    zIndex: 10,
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
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  permissionBtn: {
    marginTop: 24,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  absoluteFillCustom: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  bottom: {
    position: "absolute",
    bottom: 20,
    width: "100%",
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
  /* Countdown Timer Overlay */
  countdownOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
  },
  ratio43: {
    height: (width * 4) / 3,
    top: (height - (width * 4) / 3) / 2,
  },
  ratio169: {
    height: "100%",
    width: "100%",
  },
  countdownText: {
    fontSize: 96,
    fontWeight: "800",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  /* Recording Timer Styles */
  recordingTimerContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },
  timerText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  /* Preview Layer Styles */
  previewHeader: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  previewFooter: {
    position: "absolute",
    bottom: 20,
    right: 40,
    zIndex: 10,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    width: 130,
    justifyContent: "center",
  },
  publishBtnText: {
    color: "#7c3aed",
    fontWeight: "700",
    fontSize: 15,
  },
});
