import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@/service/auth.service";

export type PrivacyPreferenceKey =
  | "privateProfile"
  | "onlineStatus"
  | "readReceipts"
  | "activityStatus"
  | "dataSharing";

export interface PrivacyPreferences {
  /** Hide profile from users who don't follow you */
  privateProfile: boolean;
  /** Show when you're online to other users */
  onlineStatus: boolean;
  /** Let others see when you've read their messages */
  readReceipts: boolean;
  /** Show your activity on the leaderboard */
  activityStatus: boolean;
  /** Allow personalized recommendations using your data */
  dataSharing: boolean;
}

interface PrivacySettingsState extends PrivacyPreferences {
  /** True while syncing with the backend */
  syncing: boolean;
  setPreference: (key: PrivacyPreferenceKey, value: boolean) => void;
  resetDefaults: () => void;
  /** Pull the latest settings from the backend (on login / app start) */
  syncFromServer: () => Promise<void>;
  /** Push a single preference change to the backend */
  pushToServer: (key: PrivacyPreferenceKey, value: boolean) => Promise<void>;
}

const DEFAULT_PREFERENCES: PrivacyPreferences = {
  privateProfile: false,
  onlineStatus: true,
  readReceipts: true,
  activityStatus: true,
  dataSharing: true,
};

export const usePrivacySettingsStore = create<PrivacySettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,
      syncing: false,

      setPreference: (key, value) =>
        set({
          [key]: value,
        }),

      resetDefaults: () => set(DEFAULT_PREFERENCES),

      syncFromServer: async () => {
        set({ syncing: true });
        try {
          const server = await authService.getPrivacySettings();
          if (server && typeof server === "object") {
            set({
              privateProfile: server.privateProfile ?? get().privateProfile,
              onlineStatus: server.onlineStatus ?? get().onlineStatus,
              readReceipts: server.readReceipts ?? get().readReceipts,
              activityStatus: server.activityStatus ?? get().activityStatus,
              dataSharing: server.dataSharing ?? get().dataSharing,
            });
          }
        } catch (err) {
          // Offline or server error — keep the local (last-known) settings
          console.log("[privacy] sync from server failed, using local copy", err);
        } finally {
          set({ syncing: false });
        }
      },

      pushToServer: async (key, value) => {
        try {
          await authService.updatePrivacySettings({ [key]: value });
        } catch (err) {
          // Offline — the local change persists and will be re-synced later
          console.log("[privacy] push to server failed (offline?)", err);
        }
      },
    }),
    {
      name: "privacy-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
