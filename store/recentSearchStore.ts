import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SearchUserItem } from "@/service/search.service";

const MAX_RECENT = 10;

interface RecentSearchState {
  items: SearchUserItem[];
  addItem: (user: SearchUserItem) => void;
  removeItem: (userId: string) => void;
  updateItem: (userId: string, updates: Partial<SearchUserItem>) => void;
  clearAll: () => void;
}

export const useRecentSearchStore = create<RecentSearchState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (user) =>
        set((state) => {
          // Remove duplicate if already exists
          const filtered = state.items.filter((u) => u.id !== user.id);
          // Add to front and cap at MAX_RECENT
          return { items: [user, ...filtered].slice(0, MAX_RECENT) };
        }),

      removeItem: (userId) =>
        set((state) => ({
          items: state.items.filter((u) => u.id !== userId),
        })),

      updateItem: (userId, updates) =>
        set((state) => ({
          items: state.items.map((u) =>
            u.id === userId ? { ...u, ...updates } : u
          ),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: "recent-search-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
