// Bottom-sheet picker for choosing the chat wallpaper. Shared by the group
// chat and direct-message screens. Options include tiled patterns, solid
// colors, and a photo picked from the device (copied into the app document
// directory so it survives restarts). The selection is persisted locally via
// useChatBackgroundStore (AsyncStorage) — like WhatsApp, the wallpaper is a
// personal, device-local preference.

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { showError, showSuccess, showInfo } from "@/components/ui/toast";
import { Camera, Check, Palette, Sparkles, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useChatBackgroundStore } from "@/store/chatBackgroundStore";
import {
  CHAT_BACKGROUNDS,
  DEFAULT_CHAT_BACKGROUND_KEY,
  getChatBackgroundPreset,
  type ChatBackgroundPreset,
} from "./chatBackgrounds";
import { ChatBackground } from "./chatBackground";

interface ChatBackgroundPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

/** Copy a picked photo into the app's document dir so it outlives cache clears. */
async function persistBackgroundImage(sourceUri: string): Promise<string> {
  try {
    const dir = new FileSystem.Directory(
      FileSystem.Paths.document,
      "chat-backgrounds",
    );
    if (!dir.exists) {
      dir.create({ idempotent: true, intermediates: true });
    }
    const ext =
      sourceUri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
    const target = new FileSystem.File(dir, `chat-bg-${Date.now()}.${ext}`);
    const source = new FileSystem.File(sourceUri);
    source.copy(target);
    return target.uri;
  } catch (err) {
    // Best effort — fall back to the picker's cache URI if the copy fails
    console.warn("Failed to persist chat background image:", err);
    return sourceUri;
  }
}

export default function ChatBackgroundPickerModal({
  visible,
  onClose,
}: ChatBackgroundPickerModalProps) {
  const { colors, isDark } = useTheme();
  const backgroundKey = useChatBackgroundStore((state) => state.backgroundKey);
  const backgroundImageUri = useChatBackgroundStore(
    (state) => state.backgroundImageUri,
  );
  const setBackground = useChatBackgroundStore((state) => state.setBackground);
  const setImageBackground = useChatBackgroundStore(
    (state) => state.setImageBackground,
  );

  const [draftKey, setDraftKey] = useState(backgroundKey);
  const [draftImageUri, setDraftImageUri] = useState<string | null>(
    backgroundImageUri,
  );
  const [saving, setSaving] = useState(false);
  // How many SVG wallpapers are currently mounted. The preview + every
  // pattern swatch renders its own <Svg><Pattern> wallpaper; mounting all of
  // them in a single frame mid-slide-in transition is what crashed the app
  // on open. InteractionManager.runAfterInteractions doesn't wait for the
  // (native) Modal slide animation, so instead we wait out the slide with a
  // timer and then reveal the preview first and each pattern swatch one
  // animation frame at a time. Solid-color swatches stay plain Views.
  const [mountedCount, setMountedCount] = useState(0);
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Seed the draft with the current selection each time the sheet opens
  useEffect(() => {
    if (!visible) return;
    setDraftKey(backgroundKey);
    setDraftImageUri(backgroundImageUri);
    setMountedCount(0);
    if (revealIntervalRef.current) {
      clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
    // Wait out the native slide-in (~300ms) before mounting any SVG, then
    // reveal the preview and each pattern swatch one per frame.
    const revealTimer = setTimeout(() => {
      setMountedCount(1);
      revealIntervalRef.current = setInterval(() => {
        setMountedCount((c) => {
          if (c >= patterns.length + 1) {
            if (revealIntervalRef.current) {
              clearInterval(revealIntervalRef.current);
              revealIntervalRef.current = null;
            }
            return c;
          }
          return c + 1;
        });
      }, 50);
    }, 400);
    return () => {
      clearTimeout(revealTimer);
      if (revealIntervalRef.current) {
        clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
      }
    };
  }, [visible, backgroundKey, backgroundImageUri]);

  const patterns = CHAT_BACKGROUNDS.filter((b) => b.kind === "pattern");
  const colorsList = CHAT_BACKGROUNDS.filter((b) => b.kind === "color");
  const draftPreset = getChatBackgroundPreset(draftKey);
  const photoSelected = draftKey === "image" && Boolean(draftImageUri);

  const handlePickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError("Allow photo access to set an image background.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const durableUri = await persistBackgroundImage(result.assets[0].uri);
        setDraftKey("image");
        setDraftImageUri(durableUri);
      }
    } catch (err) {
      console.warn("Image picker failed:", err);
      showError("Could not load image. Please try again.");
    }
  };

  const handleRemovePhoto = () => {
    setDraftImageUri(null);
    setDraftKey(DEFAULT_CHAT_BACKGROUND_KEY);
  };

  const handleSave = () => {
    if (draftKey === "image" && !draftImageUri) {
      showInfo("Pick an image from your gallery to use as the background.");
      return;
    }
    setSaving(true);
    if (draftKey === "image" && draftImageUri) {
      setImageBackground(draftImageUri);
    } else {
      setBackground(draftKey);
    }
    setSaving(false);
    showSuccess("Chat background updated");
    onClose();
  };

  const renderOption = (preset: ChatBackgroundPreset, index: number) => {
    const isSelected = draftKey === preset.key;
    // Pattern wallpapers mount progressively (one per frame after the slide)
    // so the sheet never renders several <Svg> patterns at once. Solid colors
    // are plain Views and render immediately.
    const showWallpaper =
      preset.kind !== "pattern" || mountedCount >= index + 2;
    const wallpaperBaseColor = isDark
      ? preset.darkColor
      : preset.lightColor;
    return (
      <TouchableOpacity
        key={preset.key}
        onPress={() => setDraftKey(preset.key)}
        activeOpacity={0.75}
        style={{ width: "30%", aspectRatio: 1, marginBottom: 20 }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: isSelected ? colors.primary : colors.border,
            padding: 3,
            backgroundColor: isSelected
              ? "rgba(59, 130, 246, 0.08)"
              : "transparent",
            shadowColor: "#000",
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          {showWallpaper ? (
            <ChatBackground
              preset={preset}
              isDark={isDark}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 14,
                overflow: "hidden",
              }}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 14,
                backgroundColor: wallpaperBaseColor,
              }}
            />
          )}
          {isSelected && (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: "#FFFFFF",
              }}
            >
              <Check size={11} color="#FFFFFF" strokeWidth={3.5} />
            </View>
          )}
        </View>
        <ThemedText
          style={{
            textAlign: "center",
            marginTop: 6,
            fontSize: 11,
            fontWeight: isSelected ? "700" : "500",
            color: isSelected ? colors.primary : colors.muted,
          }}
        >
          {preset.label}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  const SectionHeader = ({
    icon,
    title,
  }: {
    icon: React.ReactNode;
    title: string;
  }) => (
    <View className="flex-row items-center mb-3 mt-1">
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
          backgroundColor: "rgba(59, 130, 246, 0.1)",
        }}
      >
        {icon}
      </View>
      <ThemedText
        style={{ color: colors.muted || "#a1a1aa" }}
        className="text-[11px] font-bold uppercase tracking-wider"
      >
        {title}
      </ThemedText>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.card || colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            paddingBottom: 36,
            maxHeight: "88%",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row items-center justify-between mb-4">
            <ThemedText className="text-lg font-bold">Chat Background</ThemedText>
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full">
              <X size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Live preview of the selected wallpaper */}
            <View
              style={{
                height: 104,
                borderRadius: 18,
                overflow: "hidden",
                marginBottom: 4,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {mountedCount >= 1 ? (
                <ChatBackground
                  preset={draftPreset}
                  isDark={isDark}
                  imageUri={draftImageUri}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: isDark
                        ? draftPreset.darkColor
                        : draftPreset.lightColor,
                    },
                  ]}
                />
              )}
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  left: 10,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <ThemedText className="text-[10px] font-semibold text-white">
                  Preview
                </ThemedText>
              </View>
              <View className="flex-1 justify-end p-3">
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: isDark ? "#2f3b43" : "#ffffff",
                    borderRadius: 12,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    maxWidth: "80%",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 12,
                      color: isDark ? "#e6edf3" : "#111827",
                    }}
                  >
                    This is how your chat will look ✨
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* From your photos */}
            <SectionHeader icon={<Camera size={13} color="#3b82f6" />} title="From Your Photos" />
            <View className="flex-row items-start mb-4">
              <TouchableOpacity
                onPress={handlePickImage}
                activeOpacity={0.75}
                style={{ width: "30%" }}
              >
                <View
                  style={{
                    borderRadius: 18,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    borderColor: photoSelected ? colors.primary : colors.border,
                    padding: 3,
                    backgroundColor: photoSelected
                      ? "rgba(59, 130, 246, 0.08)"
                      : "transparent",
                  }}
                >
                  {photoSelected ? (
                    <View style={{ position: "relative" }}>
                      <Image
                        source={{ uri: draftImageUri || undefined }}
                        resizeMode="cover"
                        style={{
                          width: "100%",
                          aspectRatio: 1,
                          borderRadius: 14,
                        }}
                      />
                      <TouchableOpacity
                        onPress={handleRemovePhoto}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: "rgba(0,0,0,0.65)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        aspectRatio: 1,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: isDark ? "#27272a" : "#f4f4f5",
                      }}
                    >
                      <Camera size={26} color={colors.muted || "#a1a1aa"} />
                    </View>
                  )}
                </View>
                <ThemedText
                  style={{
                    textAlign: "center",
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: photoSelected ? "700" : "500",
                    color: photoSelected ? colors.primary : colors.muted,
                  }}
                >
                  Photo
                </ThemedText>
              </TouchableOpacity>
              <ThemedText
                style={{
                  flex: 1,
                  marginLeft: 12,
                  marginTop: 4,
                  fontSize: 11,
                  lineHeight: 16,
                  color: colors.muted || "#a1a1aa",
                }}
              >
                Pick an image from your gallery. It's saved inside the app, so
                it stays even after restarts.
              </ThemedText>
            </View>

            {/* Pattern options */}
            <SectionHeader
              icon={""}
              title="Patterns"
            />
            <View className="flex-row flex-wrap justify-between">
              {patterns.map(renderOption)}
            </View>

            {/* Solid color options */}
            <SectionHeader
              icon={<Palette size={13} color="#ec4899" />}
              title="Solid Colors"
            />
            <View className="flex-row flex-wrap justify-between">
              {colorsList.map(renderOption)}
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              opacity: saving ? 0.7 : 1,
            }}
            className="py-3.5 rounded-2xl items-center justify-center flex-row mt-3"
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                Set as Background
              </ThemedText>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
