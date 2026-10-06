import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { File, Directory, Paths } from "expo-file-system";
import { Image as ExpoImage } from "expo-image";

import AuthHeader from "@/components/auth/authHeader";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { showError, showSuccess } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

// Explicit Cache Paths — NEVER clear Paths.cache directly.
// expo-file-system's Directory/Paths.cache are unimplemented on web (the web
// shim's FileSystemDirectory has no validatePath(), so constructing one there
// throws) — this whole on-device cache manager is a native-only concept, so
// CACHE_TARGETS is simply unavailable on web and every usage below no-ops.
const CACHE_TARGETS =
  Platform.OS !== "web"
    ? {
        imagePicker: new Directory(Paths.cache, "ImagePicker"),
        videoThumbnails: new Directory(Paths.cache, "VideoThumbnails"),
        giftThumbnails: new Directory(Paths.cache, "gift-thumbnails"),
        giftVideos: new Directory(Paths.cache, "gift-videos"),
      }
    : null;

// ─── Utility Helpers ──────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

async function getDirSize(dir: Directory): Promise<number> {
  try {
    if (!dir.exists) return 0;
    const items = dir.list();
    let total = 0;
    for (const item of items) {
      if (item instanceof File) {
        total += item.size || 0;
      } else if (item instanceof Directory) {
        total += await getDirSize(item);
      }
    }
    return total;
  } catch {
    return 0;
  }
}

async function safeClearDir(dir: Directory): Promise<boolean> {
  try {
    if (dir.exists) {
      dir.delete();
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Background Auto-Purge Hook
 * Mount at root (_layout.tsx or App.tsx) to prevent cache build-up without user intervention.
 */
export function useAutoStorageCleanup() {
  useEffect(() => {
    if (!CACHE_TARGETS) return;
    const timer = setTimeout(async () => {
      // Clean temporary picker & video generator leftovers on startup
      await Promise.all([
        safeClearDir(CACHE_TARGETS.imagePicker),
        safeClearDir(CACHE_TARGETS.videoThumbnails),
      ]);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);
}

// ─── Main Component ───────────────────────────────────────────────────

export default function StorageCacheScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [mediaPickerSize, setMediaPickerSize] = useState(0);
  const [feedThumbnailsSize, setFeedThumbnailsSize] = useState(0);
  const [giftCacheSize, setGiftCacheSize] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const calculateStorage = useCallback(async () => {
    if (!CACHE_TARGETS) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [picker, videoThumbs, giftThumbs, giftVids] = await Promise.all([
        getDirSize(CACHE_TARGETS.imagePicker),
        getDirSize(CACHE_TARGETS.videoThumbnails),
        getDirSize(CACHE_TARGETS.giftThumbnails),
        getDirSize(CACHE_TARGETS.giftVideos),
      ]);

      setMediaPickerSize(picker);
      setFeedThumbnailsSize(videoThumbs);
      setGiftCacheSize(giftThumbs + giftVids);
    } catch (err) {
      console.error("[StorageManager] Error reading disk size:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateStorage();
  }, [calculateStorage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await calculateStorage();
    setRefreshing(false);
  };

  const handleClearAll = () => {
    const total = mediaPickerSize + feedThumbnailsSize + giftCacheSize;
    if (total === 0) {
      showSuccess("Storage is already clean");
      return;
    }

    Alert.alert(
      "Clear Temporary Cache",
      `Frees ${formatBytes(total)} of temporary media staging and preview frames. Your posts and account data will remain intact.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Space",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true);
            try {
              // Clear FileSystem directories (native only — no local disk
              // cache to clear on web, see CACHE_TARGETS above)
              await Promise.all([
                ...(CACHE_TARGETS
                  ? [
                      safeClearDir(CACHE_TARGETS.imagePicker),
                      safeClearDir(CACHE_TARGETS.videoThumbnails),
                      safeClearDir(CACHE_TARGETS.giftThumbnails),
                      safeClearDir(CACHE_TARGETS.giftVideos),
                    ]
                  : []),
                ExpoImage.clearDiskCache(),
              ]);

              setMediaPickerSize(0);
              setFeedThumbnailsSize(0);
              setGiftCacheSize(0);
              showSuccess("Cache cleared successfully");
            } catch {
              showError("Failed to clear some temporary files");
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const totalBytes = mediaPickerSize + feedThumbnailsSize + giftCacheSize;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="default" />
        <AuthHeader title={t("storage.title")} subtitle={t("storage.subtitle")} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />
          }
        >
          {/* Main Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="server-outline" size={26} color={colors.primary || "#7C3AED"} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.summaryLabel}>Temporary Cache</ThemedText>
              {loading ? (
                <Skeleton width={110} height={24} radius={8} style={{ marginTop: 4 }} />
              ) : (
                <ThemedText style={[styles.summarySize, { color: colors.text }]}>
                  {formatBytes(totalBytes)}
                </ThemedText>
              )}
            </View>

            {totalBytes > 0 && (
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: colors.danger || "#7C3AED" }, isClearing && { opacity: 0.5 }]}
                onPress={handleClearAll}
                disabled={isClearing}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={16} color="#FFFFFF" />
                <ThemedText style={styles.clearBtnText}>Clean</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Detailed Itemization */}
          <ThemedText style={[styles.sectionTitle, { color: colors.secondary }]}>RECLAIMABLE STORAGE</ThemedText>

          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="camera-outline" size={20} color={colors.primary || "#7C3AED"} />
            <View style={styles.itemTextContainer}>
              <ThemedText style={styles.itemTitle}>Media Staging Area</ThemedText>
              <ThemedText style={[styles.itemSubtitle, { color: colors.secondary }]}>
                Uncompressed drafts from camera & photo picker
              </ThemedText>
            </View>
            {loading ? (
              <Skeleton width={48} height={13} radius={6} />
            ) : (
              <ThemedText style={styles.itemSize}>{formatBytes(mediaPickerSize)}</ThemedText>
            )}
          </View>

          <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="film-outline" size={20} color={colors.primary || "#7C3AED"} />
            <View style={styles.itemTextContainer}>
              <ThemedText style={styles.itemTitle}>Feed Video Previews</ThemedText>
              <ThemedText style={[styles.itemSubtitle, { color: colors.secondary }]}>
                Generated video cover frames from feed scrolling
              </ThemedText>
            </View>
            {loading ? (
              <Skeleton width={48} height={13} radius={6} />
            ) : (
              <ThemedText style={styles.itemSize}>{formatBytes(feedThumbnailsSize)}</ThemedText>
            )}
          </View>

          {/* <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="gift-outline" size={20} color={colors.primary || "#7C3AED"} />
            <View style={styles.itemTextContainer}>
              <ThemedText style={styles.itemTitle}>Animations & Media Assets</ThemedText>
              <ThemedText style={[styles.itemSubtitle, { color: colors.secondary }]}>
                Cached gift animations and secondary media
              </ThemedText>
            </View>
            <ThemedText style={styles.itemSize}>{loading ? "..." : formatBytes(giftCacheSize)}</ThemedText>
          </View> */}

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary || "#7C3AED"} />
            <ThemedText style={[styles.infoText, { color: colors.secondary }]}>
              Clearing cache will not delete your uploaded posts, photos in gallery, or profile settings.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40, paddingTop: 10, paddingHorizontal: 20 },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(124,58,237,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  summaryLabel: { fontSize: 13, fontWeight: "600", opacity: 0.6 },
  summarySize: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  clearBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  itemTextContainer: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "600" },
  itemSubtitle: { fontSize: 12, marginTop: 2 },
  itemSize: { fontSize: 13, fontWeight: "700" },
  infoCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});