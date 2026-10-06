/**
 * MediaLightboxModal — full-screen image gallery with swipe + download.
 * Shows all images in the chat, allows swiping, and saves to device.
 */
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Platform,
} from "react-native";
import { X, Download, Check } from "lucide-react-native";
import { File, Paths } from "expo-file-system";
import { ThemedText } from "@/components/ui/ThemedText";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface MediaLightboxModalProps {
  visible: boolean;
  /** @deprecated Use images + initialIndex instead */
  mediaUrl?: string | null;
  /** All image URLs in the chat (ordered oldest → newest) */
  images?: string[];
  /** Index of the initially selected image in the `images` array */
  initialIndex?: number;
  onClose: () => void;
}

export default function MediaLightboxModal({
  visible,
  mediaUrl,
  images,
  initialIndex = 0,
  onClose,
}: MediaLightboxModalProps) {
  const flatListRef = useRef<FlatList<string>>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const imageList =
    images && images.length > 0 ? images : mediaUrl ? [mediaUrl] : [];
  const totalCount = imageList.length;

  // Scroll to the initial index when the modal opens
  useEffect(() => {
    if (visible && imageList.length > 0) {
      setCurrentIndex(initialIndex);
      setDownloaded(false);
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialIndex * SCREEN_W,
          animated: false,
        });
      }, 50);
    }
  }, [visible, initialIndex]);

  // Reset downloaded state when swiping to a new image
  useEffect(() => {
    setDownloaded(false);
  }, [currentIndex]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_W);
      setCurrentIndex(index);
    },
    [],
  );

  const handleDownload = useCallback(async () => {
    // expo-media-library has no web implementation at all (its native module
    // handle fails to resolve even on import), and expo-file-system's
    // Paths.cache/File APIs used below aren't supported on web either — this
    // whole "save to device gallery" flow is native-only.
    if (Platform.OS === "web") return;

    const url = imageList[currentIndex];
    if (!url || downloading) return;

    setDownloading(true);
    try {
      // Lazily require native-only modules so their native-module resolution
      // never runs on web (a static top-level import would crash on load).
      const MediaLibrary = await import("expo-media-library");

      // Write-only: we only save to the gallery, never read from it
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== "granted") {
        setDownloading(false);
        return;
      }

      // Download to cache using new File API
      const downloadedFile = await File.downloadFileAsync(url, Paths.cache);
      if (!downloadedFile.exists) {
        setDownloading(false);
        return;
      }

      // Save to device gallery
      await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
      setDownloaded(true);

      // Clean up cache file
      try {
        downloadedFile.delete();
      } catch {}
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [imageList, currentIndex, downloading]);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <View
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={{ uri: item }}
          style={{ width: SCREEN_W, height: SCREEN_W * 1.2 }}
          resizeMode="contain"
        />
      </View>
    ),
    [],
  );

  if (imageList.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.95)",
        }}
      >
        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{ position: "absolute", top: 50, right: 20, zIndex: 10 }}
          className="p-2 bg-zinc-800/80 rounded-full"
        >
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Download button — no device gallery to save to on web */}
        {Platform.OS !== "web" && (
          <TouchableOpacity
            onPress={handleDownload}
            disabled={downloading}
            style={{ position: "absolute", top: 50, left: 20, zIndex: 10 }}
            className="p-2 bg-zinc-800/80 rounded-full"
          >
            {downloading ? (
              <ActivityIndicator size={20} color="#ffffff" />
            ) : downloaded ? (
              <Check size={24} color="#22c55e" />
            ) : (
              <Download size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}

        {/* Page counter */}
        {totalCount > 1 && (
          <View
            style={{
              position: "absolute",
              top: 55,
              left: 0,
              right: 0,
              zIndex: 10,
              alignItems: "center",
            }}
          >
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <ThemedText
                style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}
              >
                {currentIndex + 1} / {totalCount}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Swipeable image list */}
        <FlatList
          ref={flatListRef}
          data={imageList}
          renderItem={renderItem}
          keyExtractor={(_, idx) => `lightbox-${idx}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_W,
            offset: SCREEN_W * index,
            index,
          })}
          windowSize={3}
          maxToRenderPerBatch={3}
        />

        {/* Dot indicators for small lists */}
        {totalCount > 1 && totalCount <= 20 && (
          <View
            style={{
              position: "absolute",
              bottom: 50,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {imageList.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: idx === currentIndex ? 8 : 6,
                  height: idx === currentIndex ? 8 : 6,
                  borderRadius: 4,
                  backgroundColor:
                    idx === currentIndex
                      ? "#ffffff"
                      : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}
