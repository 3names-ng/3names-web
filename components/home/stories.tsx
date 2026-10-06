import React, { useState, useEffect, useRef } from "react";
import { 
  Image, 
  KeyboardAvoidingView,
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  View, 
  StyleSheet, 
  TextInput, 
  Dimensions,
  DeviceEventEmitter,
} from "react-native";
import { ThemedText } from "../ui/ThemedText";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; 
import StoryViewerScreen, { StoryItem, UserStoryGroup } from "../story/storyScreen";
import { storyService } from "@/service/story.service";
import { ThemedView } from "../ui/ThemedView";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { LevelBadge } from "../levelBadge";
import { ProfileFrame } from "../ui/ProfileFrame";
import StoriesSkeleton from "./storiesSkeleton";
import getRelativeTime from "@/service/helper";
import { useCreateRestriction } from "@/hooks/useCreateRestriction";
import { router } from "expo-router";
import {
  publishStoryInBackground,
  useStoryDraftStore,
} from "@/store/storyDraftStore";
import { appendSound, soundFieldsOf, type SoundSelection } from "@/service/sound.service";
import { useSoundPlayback } from "@/hooks/useSoundPlayback";
import AddSoundRow from "../sound/addSoundRow";
import { usePendingSoundStore } from "@/store/pendingSoundStore";
import SoundPickerModal from "../sound/soundPickerModal";

const { width } = Dimensions.get("window");

const PRESET_BACKGROUNDS = [
  "#7c3aed", 
  "#ec4899", 
  "#10b981", 
  "#3b82f6", 
  "#f59e0b", 
  "#111827", 
];

interface StoriesProps {
  /** Story ID passed via deep-link — auto-opens the story viewer for this story */
  openStoryId?: string;
}

export default function Stories({ openStoryId }: StoriesProps) {
  const [data, setData] = useState<UserStoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null);
  // When stepping back into the previous user's stories, they should resume
  // on that user's LAST story, not their first.
  const [enterAtEnd, setEnterAtEnd] = useState(false);
  const [isAddStoryVisible, setIsAddStoryVisible] = useState(false);
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(openStoryId ?? null);
  const hasAutoOpenedRef = useRef(false);
  
  // Text Story Flow States
  const [isTextComposerVisible, setIsTextComposerVisible] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [bgColorIndex, setBgColorIndex] = useState(0);
  const [textAlign, setTextAlign] = useState<"center" | "left" | "right">("center");
  const [textSound, setTextSound] = useState<SoundSelection | null>(null);
  const [isTextSoundPickerOpen, setIsTextSoundPickerOpen] = useState(false);
  // Hear the chosen sound while composing
  useSoundPlayback(textSound, isTextComposerVisible && !isTextSoundPickerOpen, { ignoreMute: true });
  const { isRestricted, guardCreate } = useCreateRestriction();

  // "Use this sound" → Story, from a post or story: open the Create Story
  // sheet with the sound waiting; the text composer or camera then takes it.
  const storyChooserRequested = usePendingSoundStore((s) => s.storyChooserRequested);
  const pendingStorySound = usePendingSoundStore((s) =>
    s.pending?.target === "story" ? s.pending.selection : null,
  );
  useEffect(() => {
    // The sheet isn't rendered while the rail is loading
    if (!storyChooserRequested || loading) return;
    usePendingSoundStore.getState().clearStoryChooserRequest();
    setIsAddStoryVisible(true);
  }, [storyChooserRequested, loading]);

  // Closing the sheet without choosing drops the waiting sound
  const dismissAddStory = () => {
    setIsAddStoryVisible(false);
    usePendingSoundStore.getState().consume("story");
  };

  const activeGroup = selectedUserIndex !== null ? data[selectedUserIndex] : null;

  // 1. Core Fetch Engine
  const fetchStories = async () => {
    try {
      const backendStories = await storyService.getStories();
     
      const grouped: { [key: string]: UserStoryGroup } = {};

      backendStories.forEach((item: any) => {
        if (!item || !item.user) return;

        const userId = item.userId || item.user.id;
        
        if (!grouped[userId]) {
          const displayName = item.user.username 
            ? `${item.user.username}` 
            : `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() || "User";

          grouped[userId] = {
            userId: userId,
            userName: displayName,
            userAvatar: item.user.profilePictureUrl || "https://i.pravatar.cc/100",
            profileFrame: item.user.profileFrame || null,
            level: item.user.level || null,
            stories: []
          };
        }

        grouped[userId].stories.push({
          id: item.id,
          mediaUrl: item.mediaUrl,
          type: item.mediaType,
          textContent: item.textContent,
          backgroundColor: item.backgroundColor,
          textAlign: item.textAlign,
          timestamp: (getRelativeTime(item.createdAt)),
          viewCount: item.viewCount || 0,
          giftsCount: item.giftsCount || 0,
          reactionsCount: item.reactionsCount || 0,
          myReaction: item.myReaction || null,
          // Null when the story has no sound or it was taken down
          sound: item.sound ?? null,
          soundStartMs: item.soundStartMs,
          soundVolume: item.soundVolume,
          originalVolume: item.originalVolume,
        });
      });

      const finalGroups = Object.values(grouped);
      setData(finalGroups);
    } catch (err) {
      console.error("Failed fetching active stories from database instance:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  // Optimistic stories (see store/storyDraftStore.ts): a shared story shows in
  // the rail right away under the current user, then is swapped for the
  // server copy by a refetch — or dropped if the upload failed.
  useEffect(() => {
    const published = DeviceEventEmitter.addListener(
      "NEW_STORY_PUBLISHED",
      ({ story }: { tempId: string; story: StoryItem }) => {
        if (!user?.id) return;
        setData((prev) => {
          const index = prev.findIndex((group) => group.userId === user.id);
          if (index !== -1) {
            return prev.map((group, i) =>
              i === index
                ? { ...group, stories: [...group.stories, story] }
                : group,
            );
          }
          const ownGroup: UserStoryGroup = {
            userId: user.id,
            userName: user.username || "You",
            userAvatar: user.profilePictureUrl || "https://i.pravatar.cc/100",
            profileFrame: user.profileFrame || null,
            stories: [story],
          };
          return [ownGroup, ...prev];
        });
      },
    );
    const confirmed = DeviceEventEmitter.addListener(
      "NEW_STORY_CONFIRMED",
      () => fetchStories(),
    );
    const removed = DeviceEventEmitter.addListener(
      "NEW_STORY_REMOVED",
      ({ tempId }: { tempId: string }) => {
        setData((prev) =>
          prev
            .map((group) => ({
              ...group,
              stories: group.stories.filter((story) => story.id !== tempId),
            }))
            .filter((group) => group.stories.length > 0),
        );
      },
    );
    return () => {
      published.remove();
      confirmed.remove();
      removed.remove();
    };
  }, [user?.id, user?.username, user?.profilePictureUrl, user?.profileFrame]);

  // When stories are loaded and an openStoryId was passed via deep-link,
  // find the correct user group + story and auto-open the viewer.
  useEffect(() => {
    if (!pendingStoryId || data.length === 0 || hasAutoOpenedRef.current) return;

    for (let i = 0; i < data.length; i++) {
      const group = data[i];
      const storyIndex = group.stories.findIndex((s) => s.id === pendingStoryId);
      if (storyIndex !== -1) {
        hasAutoOpenedRef.current = true;
        setEnterAtEnd(false);
        setSelectedUserIndex(i);
        setPendingStoryId(null);
        return;
      }
    }

    // Story not found in loaded data — clear pending so we don't loop forever
    setPendingStoryId(null);
  }, [pendingStoryId, data]);

  // Also react to openStoryId changes (e.g. navigating from another push)
  useEffect(() => {
    if (openStoryId && openStoryId !== pendingStoryId) {
      hasAutoOpenedRef.current = false;
      setPendingStoryId(openStoryId);
    }
  }, [openStoryId]);

  const handleFinish = () => {
    if (selectedUserIndex !== null && selectedUserIndex < data.length - 1) {
      setEnterAtEnd(false);
      setSelectedUserIndex(selectedUserIndex + 1);
    } else {
      closeViewer();
    }
  };

  // Stepping left past the first story of the current user's group steps
  // back into the previous user's group, landing on their last story.
  const handlePreviousUser = () => {
    if (selectedUserIndex !== null && selectedUserIndex > 0) {
      setEnterAtEnd(true);
      setSelectedUserIndex(selectedUserIndex - 1);
    }
  };

  // Close the viewer AND refetch so likes/gifts/views you just made
  // (or made elsewhere) show the next time the rail is opened.
  const closeViewer = () => {
    setSelectedUserIndex(null);
    fetchStories();
  };

  const handleStoryUpdated = (storyId: string, updates: { giftsCount?: number }) => {
    setData((prev) =>
      prev.map((group) => ({
        ...group,
        stories: group.stories.map((story) =>
          story.id === storyId
            ? { ...story, giftsCount: updates.giftsCount }
            : story,
        ),
      })),
    );
  };

  // "Your story" reopens a story whose upload failed, ready to share again;
  // otherwise it asks Camera/Media or Text as usual.
  const handleAddStoryPress = () => {
    const { failedDraft, clearFailedDraft } = useStoryDraftStore.getState();
    if (failedDraft?.kind === "media") {
      // The camera screen picks the draft up from the store on mount.
      router.push("/cameraScreen");
      return;
    }
    if (failedDraft?.kind === "text") {
      setStoryText(failedDraft.text);
      setBgColorIndex(failedDraft.bgColorIndex);
      setTextAlign(failedDraft.textAlign);
      setTextSound(failedDraft.sound ?? null);
      clearFailedDraft();
      setIsTextComposerVisible(true);
      return;
    }
    setIsAddStoryVisible(true);
  };

  // A sound waiting from "Use this sound" stays in the store; the camera picks it up
  const handleSelectMediaOption = () => {
    setIsAddStoryVisible(false);
  router.push("/cameraScreen")
  };

  const handleSelectTextOption = () => {
    const sound = usePendingSoundStore.getState().consume("story");
    if (sound) setTextSound(sound);
    setIsAddStoryVisible(false);
    setIsTextComposerVisible(true);
  };

  const toggleTextAlign = () => {
    if (textAlign === "center") setTextAlign("left");
    else if (textAlign === "left") setTextAlign("right");
    else setTextAlign("center");
  };

  // Optimistic: the story shows in the rail and the composer closes right
  // away; the upload runs in the background. If it fails, the draft is kept
  // and tapping "Your story" reopens it (see handleAddStoryPress).
  const handlePublishTextStory = () => {
    const text = storyText.trim();
    if (!text) return;
    if (!guardCreate("Sharing stories is disabled while your account is restricted.")) {
      return;
    }

    const backgroundColor = PRESET_BACKGROUNDS[bgColorIndex];
    const formData = new FormData();
    formData.append("textContent", storyText);
    formData.append("backgroundColor", backgroundColor);
    formData.append("textAlign", textAlign);
    appendSound(formData, textSound);

    publishStoryInBackground({
      formData,
      story: {
        type: "text",
        textContent: storyText,
        backgroundColor,
        textAlign,
        timestamp: getRelativeTime(new Date().toISOString()),
        ...soundFieldsOf(textSound),
      },
      draft: { kind: "text", text: storyText, bgColorIndex, textAlign, sound: textSound },
      successMessage: t("stories.storyPublishedMsg"),
      errorMessage: t("stories.storyFailedDraftKept"),
    });

    setStoryText("");
    setBgColorIndex(0);
    setTextAlign("center");
    setTextSound(null);
    setIsTextComposerVisible(false);
  };

  if (loading) {
    return <StoriesSkeleton />;
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
      >
        {/* Local Add Story CTA Block */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleAddStoryPress}
          className="mr-4 items-center"
        >
          <View className="relative">
             <ProfileFrame
                  frameId={user?.profileFrame}
                  uri={user?.profilePictureUrl}
                  size={72}
                  initial={user?.username?.[0]?.toUpperCase()}
                  fallbackColor={colors.primary}
                />
            <View style={styles.plusBadge}>
              <ThemedText style={styles.plusText}>+</ThemedText>
            </View>
          </View>
          <ThemedText numberOfLines={1} className="mt-2 w-20 text-center text-xs">
            {t("stories.yourStory")}
          </ThemedText>
        </TouchableOpacity>

        {/* Dynamic Feed Traversal Render Loop */}
        {data.map((item, index) => {
          return (
            <TouchableOpacity
              key={item.userId}
              activeOpacity={0.8}
              onPress={() => {
                setEnterAtEnd(false);
                setSelectedUserIndex(index);
              }}
              className="mr-4 items-center"
            >
              <View className="relative">
                <ProfileFrame
                  frameId={item.profileFrame}
                  uri={item.userAvatar}
                  size={72}
                  initial={item.userName?.[0]?.toUpperCase()}
                  fallbackColor={colors.primary}
                />
              </View>
              
              <ThemedText numberOfLines={1} className="mt-1 mb-1 w-20 text-center text-md">
                {item.userName}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Full screen modal for viewing existing stories */}
      <Modal visible={selectedUserIndex !== null} animationType="fade" statusBarTranslucent onRequestClose={closeViewer}>
        {activeGroup && (
          <StoryViewerScreen
            // Remount on user change so currentIndex/progress/pause state
            // resets — otherwise it carries over from the previous user's
            // last story and the new group never starts progressing.
            key={activeGroup.userId}
            userStories={activeGroup}
            initialIndex={enterAtEnd ? Math.max(0, activeGroup.stories.length - 1) : 0}
            onClose={closeViewer}
            onFinish={handleFinish}
            onPrevious={selectedUserIndex !== null && selectedUserIndex > 0 ? handlePreviousUser : undefined}
            onStoryUpdated={handleStoryUpdated}
          />
        )}
      </Modal>

      {/* CHOICE BOTTOM SHEET MODAL */}
      <Modal
        visible={isAddStoryVisible}
        transparent
        animationType="slide"
        onRequestClose={dismissAddStory}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={dismissAddStory}
        >
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <ThemedText style={styles.sheetTitle}>Create Story</ThemedText>

            {/* The sound picked with "Use this sound" — used by either option */}
            {pendingStorySound && (
              <View style={styles.pendingSoundPill}>
                <Ionicons name="musical-notes" size={16} color={colors.primary} />
                <ThemedText numberOfLines={1} style={styles.pendingSoundText}>
                  {pendingStorySound.sound.title} · {pendingStorySound.sound.artistName}
                </ThemedText>
              </View>
            )}

            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.optionCard} onPress={handleSelectMediaOption}>
                <View style={[styles.iconWrapper, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="camera" size={28} color="#3b82f6" />
                </View>
                <ThemedText style={styles.optionLabel}>Camera / Media</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={handleSelectTextOption}>
                <View style={[styles.iconWrapper, { backgroundColor: '#f5f3ff' }]}>
                  <Ionicons name="text" size={28} color="#7c3aed" />
                </View>
                <ThemedText style={styles.optionLabel}>Text Story</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FULLSCREEN TEXT STORY COMPOSER MODAL */}
      <Modal
        visible={isTextComposerVisible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsTextComposerVisible(false)}
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={[styles.composerContainer, { backgroundColor: PRESET_BACKGROUNDS[bgColorIndex] }]}>
          {/* Header Actions */}
          <View style={styles.composerHeader}>
            <TouchableOpacity 
              style={styles.roundHeaderBtn} 
              onPress={() => setIsTextComposerVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.roundHeaderBtn} onPress={() => setIsTextSoundPickerOpen(true)}>
                <Ionicons name="musical-notes" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundHeaderBtn} onPress={toggleTextAlign}>
                <MaterialIcons
                  name={textAlign === 'center' ? "format-align-center" : textAlign === 'left' ? "format-align-left" : "format-align-right"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.roundHeaderBtn} 
                  onPress={() => setBgColorIndex((prev) => (prev + 1) % PRESET_BACKGROUNDS.length)}
              >
                <Ionicons name="color-palette" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Text Input Focus Zone */}
          <View style={styles.inputArea}>
            <TextInput
              multiline
              autoFocus
              placeholder="Start typing your story..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={[styles.storyTextInput, { textAlign: textAlign }]}
              maxLength={280}
              value={storyText}
              onChangeText={setStoryText}
            />
          </View>

          {textSound && (
            <AddSoundRow
              tone="onDark"
              selection={textSound}
              onPress={() => setIsTextSoundPickerOpen(true)}
              onRemove={() => setTextSound(null)}
            />
          )}

          {/* Bottom Controls Footer */}
          {isRestricted && (
            <ThemedText
              style={{ color: "#FCA5A5", fontSize: 12, fontWeight: "600", textAlign: "center", marginBottom: 4 }}
            >
              Sharing stories is disabled while your account is restricted
            </ThemedText>
          )}
          <View style={styles.composerFooter}>
            <ThemedText style={styles.charCounter}>{storyText.length}/280</ThemedText>
            
            {/* Publishing is instant (uploads in the background), so no
                loading state is needed here. */}
            <TouchableOpacity
              style={[
                styles.publishButton,
                (!storyText.trim() || isRestricted) && { opacity: 0.6 }
              ]}
              disabled={!storyText.trim() || isRestricted}
              onPress={handlePublishTextStory}
            >
              <ThemedText style={styles.publishBtnText}>Share Story</ThemedText>
              <Ionicons name="send" size={16} color="#7c3aed" />
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>

        <SoundPickerModal
          visible={isTextSoundPickerOpen}
          onClose={() => setIsTextSoundPickerOpen(false)}
          value={textSound}
          onChange={setTextSound}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7c3aed', 
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
  },
  pendingSoundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    maxWidth: '90%',
    marginTop: -12,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  pendingSoundText: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 13,
    flexShrink: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  composerContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  roundHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyTextInput: {
    width: width - 40,
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    padding: 10,
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  charCounter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    minWidth: 130, 
    justifyContent: 'center'
  },
  publishBtnText: {
    color: '#7c3aed',
    fontWeight: '700',
    fontSize: 15,
  },
});