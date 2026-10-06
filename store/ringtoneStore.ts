import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_RINGTONE_ID } from "@/config/ringtones";

interface RingtoneState {
  /** Currently selected ringtone id */
  selectedRingtoneId: string;
  /** Set the ringtone preference */
  setSelectedRingtone: (id: string) => void;
}

export const useRingtoneStore = create<RingtoneState>()(
  persist(
    (set) => ({
      selectedRingtoneId: DEFAULT_RINGTONE_ID,
      setSelectedRingtone: (id) => set({ selectedRingtoneId: id }),
    }),
    {
      name: "ringtone-preference",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
