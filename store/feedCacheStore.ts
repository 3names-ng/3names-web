// store/feedCacheStore.ts
//
// Local snapshot of the home feed so the app can show posts immediately
// after the splash screen instead of waiting on the network fetch (which
// goes through a slow ngrok tunnel). Same pattern as messageCacheStore:
// load the cache instantly, then refresh from the server in the background.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Only enough to fill the first screens after launch; the rest comes from the server.
const MAX_POSTS_PER_TAB = 30;

interface FeedCacheState {
  /** feed tab slug -> last posts shown for that tab */
  postsByTab: Record<string, any[]>;
  /** True once the persisted cache has been loaded from AsyncStorage */
  rehydrated: boolean;
  getCachedPosts: (tabSlug: string) => any[];
  setCachedPosts: (tabSlug: string, posts: any[]) => void;
  /** Removes a post from every cached tab, so a rehydrate/re-fetch can't bring it back. */
  markPostDeleted: (postId: string) => void;
}

export const useFeedCacheStore = create<FeedCacheState>()(
  persist(
    (set, get) => ({
      postsByTab: {},
      rehydrated: false,

      getCachedPosts: (tabSlug) => get().postsByTab[tabSlug] || [],

      setCachedPosts: (tabSlug, posts) =>
        set((state) => ({
          postsByTab: { ...state.postsByTab, [tabSlug]: posts.slice(0, MAX_POSTS_PER_TAB) },
        })),

      markPostDeleted: (postId) =>
        set((state) => ({
          postsByTab: Object.fromEntries(
            Object.entries(state.postsByTab).map(([tabSlug, posts]) => [
              tabSlug,
              posts.filter((post) => post.id !== postId),
            ]),
          ),
        })),
    }),
    {
      name: "feed-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrated = true;
        }
      },
    },
  ),
);
