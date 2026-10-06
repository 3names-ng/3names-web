// store/noteCacheStore.ts
//
// Offline note cache — persisted to AsyncStorage so the Notes screen can
// show the user's notes instantly and keep displaying them without a
// network connection. Same pattern as feedCacheStore / messageCacheStore:
// load the cache as soon as it rehydrates, then refresh from the server
// in the background and merge the fresh data in.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Note } from "@/service/notes.service";

interface NoteCacheState {
  /** Last-known notes from the server (persisted to AsyncStorage) */
  notes: Note[];
  /** True once the persisted cache has been loaded from AsyncStorage */
  rehydrated: boolean;
  /**
   * Merge freshly-fetched notes into the cache. Upserts by id so filtered
   * fetches (search/category) grow the cache instead of shrinking it —
   * everything the user has ever seen stays available offline.
   */
  mergeCachedNotes: (incoming: Note[]) => void;
  /**
   * Replace the cache with the server's full (unfiltered) list, so notes
   * deleted elsewhere don't linger locally.
   */
  setCachedNotes: (notes: Note[]) => void;
  /** Insert or replace a single note in the cache (by id) */
  upsertCachedNote: (note: Note) => void;
  /** Remove a note from the cache (by id) */
  removeCachedNote: (id: string) => void;
}

export const useNoteCacheStore = create<NoteCacheState>()(
  persist(
    (set) => ({
      notes: [],
      rehydrated: false,

      mergeCachedNotes: (incoming) =>
        set((state) => {
          const byId = new Map(state.notes.map((n) => [n.id, n]));
          incoming.forEach((n) => {
            if (n?.id) byId.set(n.id, n);
          });
          return { notes: Array.from(byId.values()) };
        }),

      setCachedNotes: (notes) =>
        set({ notes: notes.filter((n) => n?.id) }),

      upsertCachedNote: (note) =>
        set((state) => {
          const exists = state.notes.some((n) => n.id === note.id);
          return {
            notes: exists
              ? state.notes.map((n) => (n.id === note.id ? note : n))
              : [note, ...state.notes],
          };
        }),

      removeCachedNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
    }),
    {
      name: "note-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrated = true;
        }
      },
    },
  ),
);