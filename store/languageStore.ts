import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type LanguageCode = "en" | "fr" | "ig" | "ha" | "yo";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  /** Two-letter flag emoji */
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ig", name: "Igbo", nativeName: "Igbo", flag: "🇳🇬" },
  { code: "ha", name: "Hausa", nativeName: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", flag: "🇳🇬" },
];

interface LanguageState {
  /** Currently selected language code */
  language: LanguageCode;
  /** Set the app language */
  setLanguage: (code: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en",

      setLanguage: (code) => {
        set({ language: code });
      },
    }),
    {
      name: "app-language",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
