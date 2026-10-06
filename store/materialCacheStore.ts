// store/materialCacheStore.ts
//
// Offline materials cache — persisted to AsyncStorage so the Materials
// screens (textbooks, lecture notes, courses, practicals, assignments)
// can show their category lists instantly and keep displaying them
// without a network connection. Same pattern as feedCacheStore /
// noteCacheStore: load the cache as soon as it rehydrates, then refresh
// from the server in the background.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  CampusMaterial,
  MaterialCategory,
} from "@/service/materials.service";

interface MaterialCacheState {
  /** material category -> last materials shown for that category */
  materialsByCategory: Record<string, CampusMaterial[]>;
  /** True once the persisted cache has been loaded from AsyncStorage */
  rehydrated: boolean;
  /** Save the category list so it's readable offline */
  setCachedMaterials: (
    category: MaterialCategory,
    materials: CampusMaterial[],
  ) => void;
}

export const useMaterialCacheStore = create<MaterialCacheState>()(
  persist(
    (set) => ({
      materialsByCategory: {},
      rehydrated: false,

      setCachedMaterials: (category, materials) =>
        set((state) => ({
          materialsByCategory: {
            ...state.materialsByCategory,
            [category]: materials,
          },
        })),
    }),
    {
      name: "material-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrated = true;
        }
      },
    },
  ),
);