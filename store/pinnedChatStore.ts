import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface PinnedChatState {
  /** Map of conversation ID → true for locally-pinned chats */
  pinnedIds: Record<string, boolean>;
  rehydrated: boolean;

  /** Mark a conversation as pinned */
  pin: (id: string) => void;
  /** Mark a conversation as unpinned */
  unpin: (id: string) => void;
  /** Toggle pin state, returns the new state */
  togglePin: (id: string) => boolean;
  /** Check if a conversation is pinned */
  isPinned: (id: string) => boolean;
  /** Set pin state from server data (merge) */
  setPinned: (id: string, pinned: boolean) => void;
}

export const usePinnedChatStore = create<PinnedChatState>()(
  persist(
    (set, get) => ({
      pinnedIds: {},
      rehydrated: false,

      pin: (id) =>
        set((state) => ({
          pinnedIds: { ...state.pinnedIds, [id]: true },
        })),

      unpin: (id) =>
        set((state) => {
          const next = { ...state.pinnedIds };
          delete next[id];
          return { pinnedIds: next };
        }),

      togglePin: (id) => {
        const current = Boolean(get().pinnedIds[id]);
        if (current) {
          get().unpin(id);
        } else {
          get().pin(id);
        }
        return !current;
      },

      isPinned: (id) => Boolean(get().pinnedIds[id]),

      setPinned: (id, pinned) => {
        if (pinned) {
          get().pin(id);
        } else {
          get().unpin(id);
        }
      },
    }),
    {
      name: "pinned-chat-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.rehydrated = true;
      },
    },
  ),
);
