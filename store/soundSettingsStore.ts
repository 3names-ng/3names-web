import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SoundSettingsState {
  /** Mutes post/story sounds and video audio everywhere (TikTok-style global toggle) */
  muted: boolean;
  toggleMuted: () => void;
  setMuted: (muted: boolean) => void;
}

export const useSoundSettingsStore = create<SoundSettingsState>()(
  persist(
    (set) => ({
      muted: false,
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      setMuted: (muted) => set({ muted }),
    }),
    {
      name: "sound-settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
