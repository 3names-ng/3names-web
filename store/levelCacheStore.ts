// store/levelCacheStore.ts
//
// Offline levels cache — persisted to AsyncStorage so the Levels screen can
// show the user's level progress and the level list instantly, and keep
// displaying them without a network connection. Same pattern as
// noteCacheStore: load the cache as soon as it rehydrates, then refresh from
// the server in the background and replace the cached copy.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Level, UserLevelResponse } from "@/screens/(features)/levelsScreen";

interface LevelCacheState {
  /** Last-known level progress for the signed-in user */
  userLevel: UserLevelResponse | null;
  /** Last-known list of all levels */
  levels: Level[];
  /** True once the persisted cache has been loaded from AsyncStorage */
  rehydrated: boolean;
  /** Replace the cache with a fresh server response */
  setCachedLevels: (userLevel: UserLevelResponse | null, levels: Level[]) => void;
}

export const useLevelCacheStore = create<LevelCacheState>()(
  persist(
    (set) => ({
      userLevel: null,
      levels: [],
      rehydrated: false,

      setCachedLevels: (userLevel, levels) => set({ userLevel, levels }),
    }),
    {
      name: "level-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userLevel: state.userLevel,
        levels: state.levels,
      }),
      // Set through the store (not by mutating `state`) so screens waiting on
      // the flag re-render.
      onRehydrateStorage: () => () => {
        useLevelCacheStore.setState({ rehydrated: true });
      },
    },
  ),
);
