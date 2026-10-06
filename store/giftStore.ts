// store/giftStore.ts
//
// Local cache for the gift catalog and its video thumbnails.
//
// GiftModal used to hit GET /gifts on every open and every gift tile
// regenerated its video thumbnail on each mount, so reopening the gift
// sheet re-fetched and re-decoded the same data constantly. Now the
// catalog is persisted locally (Zustand + AsyncStorage) and thumbnails
// are kept in memory for the session:
//   - Opening the sheet always renders the cached catalog instantly.
//   - The catalog is only fetched from the network when there's no local
//     copy, or when the local copy is stale (background refresh that never
//     blocks the UI).
//   - Each gift's video thumbnail is generated at most once per session.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { File, Directory, Paths } from "expo-file-system";
import type { Gifts } from "@/components/gift/GiftGridItem";
import { giftService } from "@/service/post.service";

/** API response contract from backend GET /gifts endpoint */
interface GiftApiResponse {
  id: string;
  name: string;
  coinCost: number;
  emoji?: string;
  isActive: boolean;
  animationUrl?: string;
  videoUrl?: string;
}

/** How old the cached catalog may be before a background refresh is allowed. */
const GIFT_CATALOG_TTL_MS = 10 * 60 * 1000;

const getRarityByCost = (cost: number): string => {
  if (cost >= 1000) return "legendary";
  if (cost >= 100) return "epic";
  return "rare";
};

/** Helper to inject Cloudinary auto-compression transforms */
const getOptimizedVideoUrl = (rawUrl?: string): string | undefined => {
  if (!rawUrl) return rawUrl;
  if (!rawUrl.includes("cloudinary.com")) return rawUrl;
  return rawUrl.replace("/upload/", "/upload/f_auto,q_auto,vc_h264/");
};

// expo-file-system's Directory/Paths.cache are unimplemented on web (the web
// shim's FileSystemDirectory has no validatePath(), so constructing one there
// throws) — skip local video caching on web and always play from videoUrl.
const GIFT_VIDEO_CACHE_DIR: Directory | null =
  Platform.OS !== "web" ? new Directory(Paths.cache, "gift-videos") : null;

interface GiftStoreState {
  /** Locally cached gift catalog (persisted to AsyncStorage). */
  gifts: Gifts[];
  /** Timestamp of the last successful catalog fetch. */
  loadedAt: number | null;
  /** Guards so a background refresh runs at most once per session. */
  refreshedThisSession: boolean;
  loading: boolean;
  /** Internal flag tracking if the disk cache directory has been scanned. */
  _cacheScanned: boolean;
  /** videoUrl -> generated local thumbnail URI (session-only, not persisted). */
  thumbnails: Record<string, string>;
  /** IDs of gifts whose video files are cached locally (session-only). */
  cachedVideoIds: Set<string>;
  /** Whether video prefetch is currently running. */
  isPrefetching: boolean;
  /**
   * Returns the catalog to render. Never blocks on the network: cached
   * gifts are returned immediately, and a stale cache is refreshed in the
   * background.
   */
  ensureGiftsLoaded: () => Promise<Gifts[]>;
  /** Fetches the catalog from the server and caches it locally. */
  refreshGifts: () => Promise<void>;
  getThumbnail: (videoUrl?: string | null) => string | undefined;
  setThumbnail: (videoUrl: string, uri: string) => void;
  /** Pre-download all gift videos to local cache for instant playback. */
  prefetchGiftVideos: () => Promise<void>;
  /** Get the local cached URI for a gift video, or remote URL as fallback. */
  getCachedVideoUri: (gift: Gifts) => string | null;
  /** Scan cache directory to populate cachedVideoIds (called on mount). */
  scanVideoCache: () => Promise<void>;
}

export const useGiftStore = create<GiftStoreState>()(
  persist(
    (set, get) => ({
      gifts: [],
      loadedAt: null,
      refreshedThisSession: false,
      loading: false,
      thumbnails: {},
      cachedVideoIds: new Set<string>(),
      isPrefetching: false,
      _cacheScanned: false,

      ensureGiftsLoaded: async () => {
        // Scan cache directory on first call to populate cachedVideoIds
        get().scanVideoCache();

        const state = get();
        if (state.gifts.length === 0) {
          // No local copy yet — fetch once and cache it.
          await state.refreshGifts();
          return get().gifts;
        }

        // Show the cached catalog immediately; only refresh in the
        // background when the copy is stale (and at most once per session).
        const isStale =
          !state.loadedAt ||
          Date.now() - state.loadedAt > GIFT_CATALOG_TTL_MS;
        if (isStale && !state.refreshedThisSession) {
          set({ refreshedThisSession: true });
          state.refreshGifts();
        }
        return state.gifts;
      },

      refreshGifts: async () => {
        if (get().loading) return;
        set({ loading: true });
        try {
          const response = await giftService.getAllGift();
          if (Array.isArray(response)) {
            const mappedGifts: Gifts[] = (response as GiftApiResponse[])
              .filter((item) => item.isActive)
              .map((item) => ({
                id: item.id,
                name: item.name,
                coins: item.coinCost,
                icon: item.emoji ?? "🎁",
                rarity: getRarityByCost(item.coinCost),
                animationUrl: item.animationUrl ?? "",
                videoUrl: getOptimizedVideoUrl(item.videoUrl),
              }));
            set({ gifts: mappedGifts, loadedAt: Date.now() });
            // Trigger video prefetch in background after catalog loads
            get().prefetchGiftVideos();
          }
        } catch (error) {
          console.error("Error fetching live gifts:", error);
        } finally {
          set({ loading: false });
        }
      },

      getThumbnail: (videoUrl) =>
        videoUrl ? get().thumbnails[videoUrl] : undefined,

      setThumbnail: (videoUrl, uri) => {
        if (!videoUrl) return;
        set((state) => ({
          thumbnails: { ...state.thumbnails, [videoUrl]: uri },
        }));
      },

      getCachedVideoUri: (gift) => {
        if (!gift.videoUrl) return null;
        const giftId = String(gift.id);
        if (GIFT_VIDEO_CACHE_DIR && get().cachedVideoIds.has(giftId)) {
          return new File(GIFT_VIDEO_CACHE_DIR, `${giftId}.mp4`).uri;
        }
        return gift.videoUrl;
      },

      scanVideoCache: async () => {
        if (get()._cacheScanned) return;
        if (!GIFT_VIDEO_CACHE_DIR) {
          set({ _cacheScanned: true });
          return;
        }
        try {
          if (!GIFT_VIDEO_CACHE_DIR.exists) {
            set({ _cacheScanned: true });
            return;
          }
          const items = GIFT_VIDEO_CACHE_DIR.list();
          const ids = new Set<string>(
            items
              .filter((item) => item instanceof File)
              .map((item) => item.name)
              .filter((name) => name.endsWith(".mp4") || name.endsWith(".webm"))
              .map((name) => name.replace(/\.(mp4|webm)$/, "")),
          );
          set({ cachedVideoIds: ids, _cacheScanned: true });
        } catch {
          set({ _cacheScanned: true });
        }
      },

      prefetchGiftVideos: async () => {
        if (!GIFT_VIDEO_CACHE_DIR) return; // no local caching on web
        const state = get();
        if (state.isPrefetching) return;

        const videosToCache = state.gifts.filter(
          (g) => g.videoUrl && !state.cachedVideoIds.has(String(g.id)),
        );
        if (videosToCache.length === 0) return;

        set({ isPrefetching: true });

        try {
          // Ensure cache directory exists
          if (!GIFT_VIDEO_CACHE_DIR.exists) {
            GIFT_VIDEO_CACHE_DIR.create();
          }

          // Download in batches of 3 to avoid network congestion
          const BATCH = 3;
          for (let i = 0; i < videosToCache.length; i += BATCH) {
            const batch = videosToCache.slice(i, i + BATCH);
            const results = await Promise.allSettled(
              batch.map(async (gift): Promise<string | null> => {
                if (!gift.videoUrl) return null;
                const destFile = new File(GIFT_VIDEO_CACHE_DIR, `${gift.id}.mp4`);
                const downloadedFile = await File.downloadFileAsync(
                  gift.videoUrl,
                  destFile,
                  { idempotent: true },
                );
                if (downloadedFile.exists) {
                  return String(gift.id);
                }
                // Clean up failed downloads
                try {
                  destFile.delete();
                } catch {}
                return null;
              }),
            );

            // Mark successful downloads
            const newIds = new Set<string>(get().cachedVideoIds);
            results.forEach((r) => {
              if (r.status === "fulfilled" && r.value) {
                newIds.add(r.value);
              }
            });
            set({ cachedVideoIds: newIds });
          }
        } catch (err) {
          console.warn("[GiftStore] Video prefetch failed:", err);
        } finally {
          set({ isPrefetching: false });
        }
      },
    }),
    {
      name: "gift-catalog-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        gifts: state.gifts,
        loadedAt: state.loadedAt,
      }),
    },
  ),
);