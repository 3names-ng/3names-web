import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Offline cache for each conversation's pinned message — mirrors
 * messageCacheStore's pattern. Chat screens show the cached pin instantly on
 * open, then the server fetch / socket events confirm or replace it.
 */

interface PinnedMessageState {
  /** conversationId (group id or DM id) -> last known pinned message, or null if none */
  pinnedMessages: Record<string, unknown | null>;
  rehydrated: boolean;
  loadCachedPinnedMessage: (conversationId: string) => unknown | null;
  setCachedPinnedMessage: (conversationId: string, message: unknown | null) => void;
}

export const usePinnedMessageStore = create<PinnedMessageState>()(
  persist(
    (set, get) => ({
      pinnedMessages: {},
      rehydrated: false,

      loadCachedPinnedMessage: (conversationId) => {
        if (!conversationId) return null;
        return get().pinnedMessages[conversationId] ?? null;
      },

      setCachedPinnedMessage: (conversationId, message) => {
        if (!conversationId) return;
        set((state) => ({
          pinnedMessages: {
            ...state.pinnedMessages,
            [conversationId]: message,
          },
        }));
      },
    }),
    {
      name: "pinned-message-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.rehydrated = true;
      },
    },
  ),
);
