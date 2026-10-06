// hooks/useGiftVideoCache.ts
//
// Convenience hook that wraps the gift store's video cache functionality.
// The actual caching logic lives in store/giftStore.ts to avoid duplicate
// scanning. This hook just provides a clean API for components.

import { useGiftStore } from "@/store/giftStore";
import type { Gifts } from "@/components/gift/GiftGridItem";

export function useGiftVideoCache() {
  const getCachedVideoUri = useGiftStore((s) => s.getCachedVideoUri);
  const isPrefetching = useGiftStore((s) => s.isPrefetching);
  const cachedVideoIds = useGiftStore((s) => s.cachedVideoIds);

  return {
    /** Get the local cached URI for a gift video, or remote URL as fallback */
    getCachedUri: getCachedVideoUri,
    /** Whether video prefetch is currently running */
    isPrefetching,
    /** Number of videos cached */
    cachedCount: cachedVideoIds.size,
    /** Check if a specific gift's video is cached */
    isCached: (giftId: string) => cachedVideoIds.has(giftId),
  };
}
