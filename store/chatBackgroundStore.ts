import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_CHAT_BACKGROUND_KEY } from "@/components/chat/chatBackgrounds";

interface ChatBackgroundState {
  /** Currently selected chat wallpaper preset key */
  backgroundKey: string;
  /**
   * Durable URI of the user-picked photo background (copied into the app
   * document directory so it survives cache clears). Used when
   * backgroundKey === "image".
   */
  backgroundImageUri: string | null;
  /** Persist a new preset selection (stored locally on the device) */
  setBackground: (key: string) => void;
  /** Persist a user-picked photo as the background */
  setImageBackground: (uri: string) => void;
}

export const useChatBackgroundStore = create<ChatBackgroundState>()(
  persist(
    (set) => ({
      backgroundKey: DEFAULT_CHAT_BACKGROUND_KEY,
      backgroundImageUri: null,
      setBackground: (key) => set({ backgroundKey: key }),
      setImageBackground: (uri) =>
        set({ backgroundKey: "image", backgroundImageUri: uri }),
    }),
    {
      name: "chat-background-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
