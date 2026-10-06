import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  FlatList,
  Text,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import {
  TEXT_FONT_PRESETS,
  TEXT_POST_FONT_SIZES,
  type TextPostSlide,
} from "./textPostStyles";
import HashtagSection from "./hashtagSection";
import AddSoundRow from "../sound/addSoundRow";
import SoundPickerModal from "../sound/soundPickerModal";
import type { SoundSelection } from "@/service/sound.service";
import TagPeopleSection from "./tagPeopleSection";
import CategorySection from "./categorySection";
import GiftSwitch from "./giftSwitch";
import PrivacySection from "./privacySection";
import { TagPeopleListContent } from "./tagPeopleModal";
import { useCreateRestriction } from "@/hooks/useCreateRestriction";

export type { TextPostSlide };

const { width } = Dimensions.get("window");

// Same preset palette as the Story text composer so the two feel identical.
const PRESET_BACKGROUNDS = [
  "#7c3aed",
  "#ec4899",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#111827",
];

// Mirrors MediaGrid's cap on media items — keeps the carousel usable and the
// header row (which gets one icon busier per action) from overflowing.
const MAX_TEXT_SLIDES = 10;

let slideIdCounter = 0;
function createTextSlide(backgroundColor: string): TextPostSlide {
  slideIdCounter += 1;
  return {
    id: `slide-${Date.now()}-${slideIdCounter}`,
    text: "",
    backgroundColor,
    textAlign: "center",
    fontStyle: "classic",
    fontSize: "medium",
  };
}

interface TaggableUser {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string | null;
  avatar?: string;
}

interface TextPostComposerProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Called with every non-empty slide (trimmed text + its own background/
   * style), mirroring how a media post carries multiple items. Must resolve
   * on success and reject on failure (errors are surfaced by the caller; the
   * composer only resets its busy state so the user can retry).
   */
  onPublish: (slides: TextPostSlide[]) => Promise<void>;
  /**
   * Slides to start from when the composer opens — e.g. a post whose upload
   * failed, so the user can post it again. Defaults to one blank slide.
   */
  initialSlides?: TextPostSlide[] | null;
  /** Save the current (non-empty) slides as a draft on the device */
  onSaveDraft?: (slides: TextPostSlide[]) => void;

  // --- Same post options a media post has (hashtags, tags, category, gift, privacy) ---
  hashtags: string[];
  onAddHashtag: (hashtag: string) => void;
  onRemoveHashtag: (hashtag: string) => void;
  taggedUsers: TaggableUser[];
  category: string;
  onCategoryChange: (category: string) => void;
  allowGift: boolean;
  onAllowGiftChange: (value: boolean) => void;
  audience: "public" | "friends" | "school_only";
  onAudienceChange: (value: "public" | "friends" | "school_only") => void;
  commentPrivacy: "everyone" | "nobody";
  onCommentPrivacyChange: (value: "everyone" | "nobody") => void;

  // --- Tag-people picker data/actions (rendered in-place inside the Post
  // Options sheet, not as a separate Modal — see comment above isShowingTagPicker) ---
  onTagPickerOpen: () => void;
  onTagPickerClose: () => void;
  tagListMode: "followers" | "following" | "everyone";
  onTagListModeChange: (mode: "followers" | "following") => void;
  tagSearchQuery: string;
  onTagSearchQueryChange: (value: string) => void;
  debouncedTagSearchQuery: string;
  isLoadingTagUsers: boolean;
  isLoadingMoreTagUsers: boolean;
  availableTagUsers: TaggableUser[];
  tagUsersCursor: string | null;
  onLoadMoreTagUsers: () => void;
  onToggleTaggedUser: (user: TaggableUser) => void;

  /** Sound played with the post */
  soundSelection: SoundSelection | null;
  onSoundChange: (selection: SoundSelection | null) => void;
}

export default function TextPostComposer({
  visible,
  onClose,
  onPublish,
  initialSlides,
  onSaveDraft,
  hashtags,
  onAddHashtag,
  onRemoveHashtag,
  taggedUsers,
  category,
  onCategoryChange,
  allowGift,
  onAllowGiftChange,
  audience,
  onAudienceChange,
  commentPrivacy,
  onCommentPrivacyChange,
  onTagPickerOpen,
  onTagPickerClose,
  tagListMode,
  onTagListModeChange,
  tagSearchQuery,
  onTagSearchQueryChange,
  debouncedTagSearchQuery,
  isLoadingTagUsers,
  isLoadingMoreTagUsers,
  availableTagUsers,
  tagUsersCursor,
  onLoadMoreTagUsers,
  onToggleTaggedUser,
  soundSelection,
  onSoundChange,
}: TextPostComposerProps) {
  const { colors } = useTheme();
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  // Opened after the Options sheet closes, so modals never stack three deep
  const [isSoundPickerOpen, setIsSoundPickerOpen] = useState(false);
  // Swaps the Options sheet's content to the tag-picker in place, rather
  // than opening a second Modal nested inside this one — nested/stacked
  // native Modals here were unreliable (invisible, or froze the screen).
  const [isShowingTagPicker, setIsShowingTagPicker] = useState(false);
  const [slides, setSlides] = useState<TextPostSlide[]>(() => [
    createTextSlide(PRESET_BACKGROUNDS[0]),
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const { isRestricted, guardCreate } = useCreateRestriction();
  const pagerRef = useRef<FlatList<TextPostSlide>>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  const activeSlide = slides[activeIndex] ?? slides[0];

  // Fresh slate (or the restored draft) every time the composer opens.
  useEffect(() => {
    if (visible) {
      setSlides(
        initialSlides?.length
          ? initialSlides
          : [createTextSlide(PRESET_BACKGROUNDS[0])],
      );
      setActiveIndex(0);
      setIsPublishing(false);
      setIsOptionsVisible(false);
      setIsShowingTagPicker(false);
    }
    // Only on open: a later change to `initialSlides` must not wipe edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const updateActiveSlide = (patch: Partial<TextPostSlide>) => {
    setSlides((prev) =>
      prev.map((slide, index) => (index === activeIndex ? { ...slide, ...patch } : slide)),
    );
  };

  const toggleTextAlign = () => {
    const next =
      activeSlide.textAlign === "center"
        ? "left"
        : activeSlide.textAlign === "left"
          ? "right"
          : "center";
    updateActiveSlide({ textAlign: next });
  };

  const cycleBackground = () => {
    const currentIndex = PRESET_BACKGROUNDS.indexOf(activeSlide.backgroundColor);
    const nextColor =
      PRESET_BACKGROUNDS[(currentIndex + 1) % PRESET_BACKGROUNDS.length];
    updateActiveSlide({ backgroundColor: nextColor });
  };

  const scrollToSlide = (index: number) => {
    pagerRef.current?.scrollToOffset({ offset: index * width, animated: true });
  };

  const handleAddSlide = () => {
    if (slides.length >= MAX_TEXT_SLIDES) return;
    const newSlide = createTextSlide(
      PRESET_BACKGROUNDS[slides.length % PRESET_BACKGROUNDS.length],
    );
    const newIndex = slides.length;
    setSlides((prev) => [...prev, newSlide]);
    setActiveIndex(newIndex);
    requestAnimationFrame(() => {
      scrollToSlide(newIndex);
      inputRefs.current[newSlide.id]?.focus();
    });
  };

  const handleRemoveActiveSlide = () => {
    if (slides.length <= 1) return;
    const removedId = activeSlide.id;
    const removedIndex = activeIndex;
    setSlides((prev) => prev.filter((slide) => slide.id !== removedId));
    const newIndex = Math.max(0, removedIndex - 1);
    setActiveIndex(newIndex);
    requestAnimationFrame(() => scrollToSlide(newIndex));
  };

  const handlePagerScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(index, slides.length - 1)));
  };

  const hasContent = slides.some((slide) => slide.text.trim().length > 0);

  const handlePublish = async () => {
    if (!hasContent || isPublishing) return;
    if (!guardCreate("Creating new posts is disabled while your account is restricted.")) {
      return;
    }
    setIsPublishing(true);
    try {
      const publishableSlides = slides
        .filter((slide) => slide.text.trim().length > 0)
        .map((slide) => ({ ...slide, text: slide.text.trim() }));
      await onPublish(publishableSlides);
      setSlides([createTextSlide(PRESET_BACKGROUNDS[0])]);
      setActiveIndex(0);
    } catch (error) {
      console.error("Text post publish failed:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => !isPublishing && onClose()}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View
          style={[
            styles.container,
            { backgroundColor: activeSlide.backgroundColor },
          ]}
        >
          {/* Header Actions */}
          <View style={styles.composerHeader}>
            <TouchableOpacity
              style={styles.roundHeaderBtn}
              disabled={isPublishing}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={styles.roundHeaderBtn}
                disabled={isPublishing}
                onPress={toggleTextAlign}
              >
                <MaterialIcons
                  name={
                    activeSlide.textAlign === "center"
                      ? "format-align-center"
                      : activeSlide.textAlign === "left"
                        ? "format-align-left"
                        : "format-align-right"
                  }
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.roundHeaderBtn}
                disabled={isPublishing}
                onPress={cycleBackground}
              >
                <Ionicons name="color-palette" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.roundHeaderBtn}
                disabled={isPublishing || slides.length >= MAX_TEXT_SLIDES}
                onPress={handleAddSlide}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={
                    slides.length >= MAX_TEXT_SLIDES
                      ? "rgba(255,255,255,0.4)"
                      : "#fff"
                  }
                />
              </TouchableOpacity>
              {slides.length > 1 && (
                <TouchableOpacity
                  style={styles.roundHeaderBtn}
                  disabled={isPublishing}
                  onPress={handleRemoveActiveSlide}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                </TouchableOpacity>
              )}
              {!!onSaveDraft && (
                <TouchableOpacity
                  style={styles.roundHeaderBtn}
                  disabled={isPublishing || !hasContent}
                  onPress={() =>
                    onSaveDraft(
                      slides
                        .filter((slide) => slide.text.trim().length > 0)
                        .map((slide) => ({ ...slide, text: slide.text.trim() })),
                    )
                  }
                  accessibilityLabel="Save draft"
                >
                  <Ionicons
                    name="document-text-outline"
                    size={19}
                    color={hasContent ? "#fff" : "rgba(255,255,255,0.4)"}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.roundHeaderBtn}
                disabled={isPublishing}
                onPress={() => setIsOptionsVisible(true)}
              >
                <Ionicons name="options-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Slide indicator: only shown once there's more than one slide */}
          {slides.length > 1 && (
            <View style={styles.slideIndicatorRow}>
              {slides.map((slide, index) => (
                <View
                  key={slide.id}
                  style={[
                    styles.slideDot,
                    index === activeIndex && styles.slideDotActive,
                  ]}
                />
              ))}
              <Text style={styles.slideCounterText}>
                {activeIndex + 1}/{slides.length}
              </Text>
            </View>
          )}

          {/* Text Input Focus Zone: one swipeable page per slide */}
          <FlatList
            ref={pagerRef}
            data={slides}
            keyExtractor={(slide) => slide.id}
            horizontal
            pagingEnabled
            scrollEnabled={slides.length > 1}
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            initialNumToRender={MAX_TEXT_SLIDES}
            windowSize={MAX_TEXT_SLIDES}
            onMomentumScrollEnd={handlePagerScrollEnd}
            renderItem={({ item }) => {
              const preset =
                TEXT_FONT_PRESETS.find((p) => p.key === item.fontStyle) ??
                TEXT_FONT_PRESETS[0];
              return (
                <View style={[styles.inputArea, { width }]}>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[item.id] = ref;
                    }}
                    multiline
                    editable={!isPublishing}
                    placeholder="Start typing your post..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={[
                      styles.storyTextInput,
                      {
                        textAlign: item.textAlign,
                        fontFamily: preset.style.fontFamily,
                        fontWeight: preset.style.fontWeight,
                        fontStyle: preset.style.fontStyle ?? "normal",
                        letterSpacing: preset.style.letterSpacing,
                        fontSize: TEXT_POST_FONT_SIZES[item.fontSize],
                        lineHeight: Math.round(
                          TEXT_POST_FONT_SIZES[item.fontSize] * 1.25,
                        ),
                      },
                    ]}
                    maxLength={250}
                    value={item.text}
                    onChangeText={(value) => {
                      setSlides((prev) =>
                        prev.map((slide) =>
                          slide.id === item.id ? { ...slide, text: value } : slide,
                        ),
                      );
                    }}
                  />
                </View>
              );
            }}
          />

          {/* Typography Toolbar: font presets + size toggle */}
          <View style={styles.typographyToolbar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1 }}
              contentContainerStyle={styles.fontChipsRow}
            >
              {TEXT_FONT_PRESETS.map((preset) => {
                const isActive = preset.key === activeSlide.fontStyle;
                return (
                  <TouchableOpacity
                    key={preset.key}
                    disabled={isPublishing}
                    activeOpacity={0.7}
                    onPress={() => updateActiveSlide({ fontStyle: preset.key })}
                    style={[
                      styles.fontChip,
                      isActive && styles.fontChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.fontChipText,
                        isActive && styles.fontChipTextActive,
                        { fontFamily: preset.style.fontFamily },
                      ]}
                    >
                      Aa
                    </Text>
                    <Text
                      style={[
                        styles.fontChipLabel,
                        isActive && styles.fontChipLabelActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Size toggle S / M / L */}
            <View style={styles.sizePicker}>
              {(
                [
                  { key: "small", label: "S" },
                  { key: "medium", label: "M" },
                  { key: "large", label: "L" },
                ] as const
              ).map((size) => {
                const isActive = size.key === activeSlide.fontSize;
                return (
                  <TouchableOpacity
                    key={size.key}
                    disabled={isPublishing}
                    activeOpacity={0.7}
                    onPress={() => updateActiveSlide({ fontSize: size.key })}
                    style={[
                      styles.sizePill,
                      isActive && styles.sizePillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sizePillText,
                        isActive && { color: "#7c3aed" },
                      ]}
                    >
                      {size.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Bottom Controls Footer */}
          {isRestricted && (
            <ThemedText
              style={{ color: "#FCA5A5", fontSize: 12, fontWeight: "600", textAlign: "center", marginBottom: 4 }}
            >
              Creating new posts is disabled while your account is restricted
            </ThemedText>
          )}
          <View style={styles.composerFooter}>
            <ThemedText style={styles.charCounter}>
              {activeSlide.text.length}/250
            </ThemedText>

            <TouchableOpacity
              style={[
                styles.publishButton,
                (!hasContent || isPublishing || isRestricted) && { opacity: 0.6 },
              ]}
              disabled={!hasContent || isPublishing || isRestricted}
              onPress={handlePublish}
            >
              {isPublishing ? (
                <ActivityIndicator
                  size="small"
                  color="#7c3aed"
                  style={{ paddingHorizontal: 22 }}
                />
              ) : (
                <>
                  <ThemedText style={styles.publishBtnText}>Share Post</ThemedText>
                  <Ionicons name="send" size={16} color="#7c3aed" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Post Options: same hashtags / tags / category / gift / privacy a media post has */}
      <Modal
        visible={isOptionsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOptionsVisible(false)}
      >
        <View style={styles.optionsOverlay}>
          <View
            style={[
              styles.optionsSheet,
              { backgroundColor: colors.background },
            ]}
          >
            {isShowingTagPicker ? (
              <TagPeopleListContent
                onClose={() => {
                  setIsShowingTagPicker(false);
                  onTagPickerClose();
                }}
                tagListMode={tagListMode}
                onTagListModeChange={onTagListModeChange}
                searchQuery={tagSearchQuery}
                onSearchQueryChange={onTagSearchQueryChange}
                debouncedSearchQuery={debouncedTagSearchQuery}
                taggedUsers={taggedUsers}
                isLoadingUsers={isLoadingTagUsers}
                isLoadingMoreUsers={isLoadingMoreTagUsers}
                availableUsers={availableTagUsers}
                usersCursor={tagUsersCursor}
                onLoadMore={onLoadMoreTagUsers}
                onToggleUser={onToggleTaggedUser}
              />
            ) : (
              <>
                <View style={styles.optionsHeader}>
                  <ThemedText style={styles.optionsTitle}>Post Options</ThemedText>
                  <TouchableOpacity onPress={() => setIsOptionsVisible(false)}>
                    <Ionicons name="close" size={26} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <AddSoundRow
                    selection={soundSelection}
                    onPress={() => {
                      setIsOptionsVisible(false);
                      setIsSoundPickerOpen(true);
                    }}
                    onRemove={() => onSoundChange(null)}
                  />
                  <HashtagSection
                    hashtags={hashtags}
                    onAddHashtag={onAddHashtag}
                    onRemoveHashtag={onRemoveHashtag}
                  />
                  <TagPeopleSection
                    taggedUsers={taggedUsers}
                    onPressRow={() => {
                      setIsShowingTagPicker(true);
                      onTagPickerOpen();
                    }}
                  />
                  <CategorySection
                    category={category}
                    onChange={onCategoryChange}
                  />
                  <GiftSwitch
                    enabled={allowGift}
                    onValueChange={onAllowGiftChange}
                  />
                  <PrivacySection
                    audience={audience}
                    commentPrivacy={commentPrivacy}
                    onAudienceChange={onAudienceChange}
                    onCommentPrivacyChange={onCommentPrivacyChange}
                  />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <SoundPickerModal
        visible={isSoundPickerOpen}
        onClose={() => {
          setIsSoundPickerOpen(false);
          setIsOptionsVisible(true);
        }}
        value={soundSelection}
        onChange={onSoundChange}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingBottom: 24,
  },
  composerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  slideIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  slideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  slideDotActive: {
    width: 16,
    backgroundColor: "#fff",
  },
  slideCounterText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  roundHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  inputArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  storyTextInput: {
    width: width - 40,
    color: "#fff",
    padding: 10,
    textAlignVertical: "center",
  },
  typographyToolbar: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  fontChipsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 12,
  },
  fontChip: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
    minWidth: 66,
  },
  fontChipActive: {
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  fontChipText: {
    color: "#fff",
    fontSize: 20,
    lineHeight: 24,
  },
  fontChipTextActive: {
    color: "#7c3aed",
  },
  fontChipLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  fontChipLabelActive: {
    color: "#7c3aed",
  },
  sizePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 20,
    padding: 3,
    marginLeft: 4,
  },
  sizePill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sizePillActive: {
    backgroundColor: "#fff",
  },
  sizePillText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  composerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  charCounter: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    minWidth: 130,
    justifyContent: "center",
  },
  publishBtnText: {
    color: "#7c3aed",
    fontWeight: "700",
    fontSize: 15,
  },
  optionsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  optionsSheet: {
    height: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  optionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
});
