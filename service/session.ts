/**
 * session.ts
 *
 * Reacts to sign-in / sign-out transitions on the auth store, so every
 * logout path (logout button, account deletion, 401 from the API) gets the
 * same cleanup:
 *   - realtime sockets are disconnected (and reconnected with the new token
 *     on the next sign-in)
 *   - this device's refresh token is revoked on the server
 *   - user-scoped caches are wiped, so the next person on this device can't
 *     see the previous user's messages, feed, calls, etc.
 *
 * Device preferences (theme, language, ringtone, waveform, chat background,
 * notification settings) are intentionally kept.
 *
 * Imported once from app/_layout.tsx.
 */

import { api } from "@/service/api";
import { useAuthStore } from "@/store/authStore";
import { disconnectAll, reconnectAll } from "@/service/socketManager";
import { setSentryUser } from "@/utils/sentry";
import { identifyPurchaser } from "@/utils/purchases";
import { useAIChatCacheStore } from "@/store/aiChatCacheStore";
import { useCallHistoryStore } from "@/store/callHistoryStore";
import { useCoinBattleStore } from "@/store/coinBattleStore";
import { useDepartmentWarStore } from "@/store/departmentWarStore";
import { useFeedCacheStore } from "@/store/feedCacheStore";
import { useHostelStore } from "@/store/hostelStore";
import { useLevelCacheStore } from "@/store/levelCacheStore";
import { useMaterialCacheStore } from "@/store/materialCacheStore";
import { useMessageCacheStore } from "@/store/messageCacheStore";
import { useNoteCacheStore } from "@/store/noteCacheStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useOnlineUsersStore } from "@/store/onlineUsersStore";
import { usePinnedChatStore } from "@/store/pinnedChatStore";
import { usePinnedMessageStore } from "@/store/pinnedMessageStore";
import { usePrivacySettingsStore } from "@/store/privacySettingsStore";
import { useProfileCacheStore } from "@/store/profileCacheStore";
import { useProjectTopicCacheStore } from "@/store/projectTopicCacheStore";
import { useRecentSearchStore } from "@/store/recentSearchStore";
import { useStoryDraftStore } from "@/store/storyDraftStore";
import { useWhotStore } from "@/store/whotStore";

interface ResettableStore {
  getState: () => any;
  getInitialState: () => any;
  setState: (state: any, replace: true) => void;
}

const USER_SCOPED_STORES: ResettableStore[] = [
  useAIChatCacheStore,
  useCallHistoryStore,
  useCoinBattleStore,
  useDepartmentWarStore,
  useFeedCacheStore,
  useHostelStore,
  useLevelCacheStore,
  useMaterialCacheStore,
  useMessageCacheStore,
  useNoteCacheStore,
  useNotificationStore,
  useOnboardingStore,
  useOnlineUsersStore,
  usePinnedChatStore,
  // usePostDraftStore is intentionally NOT reset: drafts are kept per account
  // (filtered by ownerId) so they come back when the same user logs in again.
  usePinnedMessageStore,
  usePrivacySettingsStore,
  useProfileCacheStore,
  useProjectTopicCacheStore,
  useRecentSearchStore,
  useStoryDraftStore,
  useWhotStore,
];

// Screens wait on these before reading a cache; resetting them to their
// initial `false` would leave those screens waiting forever.
const HYDRATION_FLAGS = ["rehydrated", "_hasHydrated", "isHydrated"];

function resetStore(store: ResettableStore) {
  const current = store.getState();
  const flags: Record<string, unknown> = {};
  for (const key of HYDRATION_FLAGS) {
    if (key in current) flags[key] = current[key];
  }
  // For persisted stores this also overwrites what's saved on disk.
  store.setState({ ...store.getInitialState(), ...flags }, true);
}

function clearUserData() {
  for (const store of USER_SCOPED_STORES) {
    try {
      resetStore(store);
    } catch (err) {
      console.warn("[session] failed to reset store:", err);
    }
  }
}

useAuthStore.subscribe((state, prev) => {
  if (prev.isAuthenticated && !state.isAuthenticated) {
    if (prev.refreshToken) {
      // Best effort: if offline the token just expires on its own.
      api.post("/auth/logout", { refreshToken: prev.refreshToken }).catch(() => {});
    }
    disconnectAll();
    clearUserData();
    setSentryUser(null);
    identifyPurchaser(null);
  } else if (!prev.isAuthenticated && state.isAuthenticated) {
    reconnectAll();
  }
  if (state.user?.id !== prev.user?.id && state.isAuthenticated && state.user?.id) {
    setSentryUser(state.user.id);
    identifyPurchaser(state.user.id);
  }
});
