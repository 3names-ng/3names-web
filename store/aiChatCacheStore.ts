// store/aiChatCacheStore.ts
//
// Offline cache of the AI assistant's chat history — persisted to
// AsyncStorage so the AI Assistant screen can show past chats instantly
// and keep displaying them without a network connection. Same pattern as
// noteCacheStore / feedCacheStore: load the cache as soon as it
// rehydrates, then refresh from the server in the background and merge
// the fresh data in.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatSession } from "@/service/ai.service";

interface AIChatCacheState {
  /** Last-known chat sessions from the server (persisted to AsyncStorage) */
  chats: ChatSession[];
  /** True once the persisted cache has been loaded from AsyncStorage */
  rehydrated: boolean;
  /** Replace the cached chats with freshly-fetched history */
  setCachedChats: (chats: ChatSession[]) => void;
  /** Insert or replace a single chat in the cache (by id) */
  upsertCachedChat: (chat: ChatSession) => void;
  /** Remove a chat from the cache (by id) */
  removeCachedChat: (id: string) => void;
}

export const useAIChatCacheStore = create<AIChatCacheState>()(
  persist(
    (set) => ({
      chats: [],
      rehydrated: false,

      setCachedChats: (chats) => set({ chats }),

      upsertCachedChat: (chat) =>
        set((state) => {
          const exists = state.chats.some((c) => c.id === chat.id);
          return {
            chats: exists
              ? state.chats.map((c) => (c.id === chat.id ? chat : c))
              : [chat, ...state.chats],
          };
        }),

      removeCachedChat: (id) =>
        set((state) => ({ chats: state.chats.filter((c) => c.id !== id) })),
    }),
    {
      name: "ai-chat-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrated = true;
        }
      },
    },
  ),
);