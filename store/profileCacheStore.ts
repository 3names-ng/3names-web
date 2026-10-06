// store/profileCacheStore.ts
//
// Offline profile cache — persisted to AsyncStorage so the Profile screen
// can show the user's stats instantly and keep displaying them without a
// network connection. Same pattern as feedCacheStore / materialCacheStore:
// load the cache as soon as it rehydrates, then refresh from the server
// in the background.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfileStats } from "@/service/profile.Service";
import type { UserWarStats } from "@/service/departmentWar.service";

interface ProfileCacheState {
  /** Last-known profile stats (persisted to AsyncStorage) */
  stats: UserProfileStats | null;
  /** Last-known brain-battle war stats (persisted to AsyncStorage) */
  warStats: UserWarStats | null;
  /** True once the persisted cache has been loaded from AsyncStorage */
  rehydrated: boolean;
  /** Save the profile stats so they're readable offline */
  setStats: (stats: UserProfileStats) => void;
  /** Save the war stats so they're readable offline */
  setWarStats: (warStats: UserWarStats) => void;
}

export const useProfileCacheStore = create<ProfileCacheState>()(
  persist(
    (set) => ({
      stats: null,
      warStats: null,
      rehydrated: false,

      setStats: (stats) => set({ stats }),

      setWarStats: (warStats) => set({ warStats }),
    }),
    {
      name: "profile-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrated = true;
        }
      },
    },
  ),
);