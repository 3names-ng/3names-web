import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Offline message cache — WhatsApp-style local history.
 *
 * Every conversation (DM or group) stores its last-fetched messages in
 * AsyncStorage. Chat screens load the cache instantly on open (works fully
 * offline), then fetch fresh history from the server and merge it in.
 *
 * Note on timing: rehydration from AsyncStorage is async, so screens must
 * wait for `rehydrated === true` before reading the cache (otherwise the
 * first read on a cold start misses and shows the loading spinner).
 */

export interface CachedMessage {
  id: string;
  createdAt: string;
  [key: string]: unknown;
}

interface MessageCacheState {
  /** conversationId (group id) -> last known messages, oldest → newest */
  conversations: Record<string, CachedMessage[]>;
  /** Last-known group list (my groups + default/explore groups), for offline list viewing */
  cachedGroupList: Record<string, unknown[]> | null;
  /** Last-known direct conversation list, for offline chat list viewing */
  cachedDirectConversations: unknown[] | null;
  /** True once persisted cache has been loaded from AsyncStorage */
  rehydrated: boolean;
  loadCachedMessages: (conversationId: string) => CachedMessage[];
  /** Merge fetched messages into the cache (dedup by id, keep sort) */
  setCachedMessages: (
    conversationId: string,
    messages: unknown[],
  ) => void;
  clearCachedMessages: (conversationId: string) => void;
  /** Load the last-known group list (empty object if never fetched) */
  loadCachedGroupList: () => Record<string, unknown[]>;
  /** Save the group list so it's readable offline */
  setCachedGroupList: (groups: Record<string, unknown[]>) => void;
  /** Load the last-known direct conversations list */
  loadCachedDirectConversations: () => unknown[];
  /** Save the direct conversations list so it's readable offline */
  setCachedDirectConversations: (conversations: unknown[]) => void;
}

// The whole cache is one AsyncStorage entry, rewritten on every message.
// Android caps a single entry at ~2MB, so keep only what's needed to show a
// chat instantly on open; the full history always comes from the server.
const MAX_MESSAGES_PER_CONVERSATION = 100;
const MAX_CONVERSATIONS = 50;

const sortByCreatedAt = (list: CachedMessage[]) =>
  [...list].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

export const useMessageCacheStore = create<MessageCacheState>()(
  persist(
    (set, get) => ({
      conversations: {},
      cachedGroupList: null,
      cachedDirectConversations: null,
      rehydrated: false,

      loadCachedMessages: (conversationId) => {
        if (!conversationId) return [];
        return get().conversations[conversationId] || [];
      },

      setCachedMessages: (conversationId, messages) => {
        if (!conversationId) return;
        const merged = sortByCreatedAt(messages as CachedMessage[]).slice(
          -MAX_MESSAGES_PER_CONVERSATION,
        );
        set((state) => {
          // Re-insert so key order tracks recency, then drop the oldest chats.
          const { [conversationId]: _previous, ...others } = state.conversations;
          const entries = Object.entries(others).slice(-(MAX_CONVERSATIONS - 1));
          return {
            conversations: {
              ...Object.fromEntries(entries),
              [conversationId]: merged,
            },
          };
        });
      },

      clearCachedMessages: (conversationId) => {
        set((state) => {
          const next = { ...state.conversations };
          delete next[conversationId];
          return { conversations: next };
        });
      },

      loadCachedGroupList: () => get().cachedGroupList || {},

      setCachedGroupList: (groups) => {
        set({ cachedGroupList: groups });
      },

      loadCachedDirectConversations: () => get().cachedDirectConversations || [],

      setCachedDirectConversations: (conversations) => {
        set({ cachedDirectConversations: conversations });
      },
    }),
    {
      name: "message-cache-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.rehydrated = true;
          // Shrink caches written before the limits existed.
          const trimmed = Object.entries(state.conversations)
            .slice(-MAX_CONVERSATIONS)
            .map(([id, list]) => [id, list.slice(-MAX_MESSAGES_PER_CONVERSATION)]);
          useMessageCacheStore.setState({
            conversations: Object.fromEntries(trimmed),
          });
        }
      },
    },
  ),
);
