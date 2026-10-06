import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/service/api";

export type NotificationPreferenceKey =
  | "pushEnabled"
  | "messages"
  | "marketplace"
  | "hostel"
  | "leaderboard"
  | "general"
  | "war"
  | "soundEnabled";

export interface NotificationPreferences {
  /** Master toggle - when off, no push notifications are delivered */
  pushEnabled: boolean;
  /** Direct messages & comments */
  messages: boolean;
  /** Marketplace activity (new listings, offers, etc.) */
  marketplace: boolean;
  /** Hostel listings & booking updates */
  hostel: boolean;
  /** Leaderboard / level-up updates */
  leaderboard: boolean;
  /** Announcements & product updates */
  general: boolean;
  /** Department War battles, challenges, and results */
  war: boolean;
  /** Play a sound when a notification arrives */
  soundEnabled: boolean;
}

interface NotificationSettingsState extends NotificationPreferences {
  setPreference: (key: NotificationPreferenceKey, value: boolean) => void;
  resetDefaults: () => void;
  syncFromServer: () => Promise<void>;
  syncToServer: () => Promise<void>;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  messages: true,
  marketplace: true,
  hostel: true,
  leaderboard: true,
  general: true,
  war: true,
  soundEnabled: true,
};

// Map local preference keys to backend channel names
const KEY_TO_CHANNEL: Record<string, string> = {
  messages: "social",
  marketplace: "social",
  hostel: "social",
  leaderboard: "system",
  general: "social",
  war: "default",
};

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_PREFERENCES,

      setPreference: async (key, value) => {
        set({ [key]: value });
        // Sync to server in background
        try {
          const state = get();
          const backendPrefs: Record<string, boolean> = {
            pushEnabled: state.pushEnabled,
            social: state.messages && state.marketplace && state.hostel && state.general,
            messages: state.messages,
            gifts: true,
            system: state.leaderboard,
            default: state.war,
          };
          await api.patch("/notifications/preferences", backendPrefs);
        } catch (err) {
          console.warn("[NotifSettings] Failed to sync to server:", err);
        }
      },

      resetDefaults: () => {
        set(DEFAULT_PREFERENCES);
        get().syncToServer();
      },

      syncFromServer: async () => {
        try {
          const response = await api.get("/notifications/preferences");
          const serverPrefs = response.data;
          if (serverPrefs && typeof serverPrefs === "object") {
            set({
              pushEnabled: serverPrefs.pushEnabled ?? true,
              messages: serverPrefs.messages ?? true,
              marketplace: serverPrefs.marketplace ?? true,
              hostel: serverPrefs.hostel ?? true,
              leaderboard: serverPrefs.leaderboard ?? true,
              general: serverPrefs.general ?? true,
              war: serverPrefs.war ?? serverPrefs.default ?? true,
              soundEnabled: serverPrefs.soundEnabled ?? true,
            });
          }
        } catch (err) {
          console.warn("[NotifSettings] Failed to sync from server:", err);
        }
      },

      syncToServer: async () => {
        try {
          const state = get();
          const backendPrefs: Record<string, boolean> = {
            pushEnabled: state.pushEnabled,
            social: state.messages && state.marketplace && state.hostel && state.general,
            messages: state.messages,
            gifts: true,
            system: state.leaderboard,
            default: state.war,
          };
          await api.patch("/notifications/preferences", backendPrefs);
        } catch (err) {
          console.warn("[NotifSettings] Failed to sync to server:", err);
        }
      },
    }),
    {
      name: "notification-settings-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
