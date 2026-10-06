import { create } from "zustand";

export type AlertBannerType = "success" | "error" | "info";

interface AlertBannerState {
  visible: boolean;
  message: string;
  type: AlertBannerType;
  show: (message: string, type?: AlertBannerType) => void;
  hide: () => void;
}

export const useAlertBannerStore = create<AlertBannerState>((set) => ({
  visible: false,
  message: "",
  type: "info",

  show: (message, type = "info") =>
    set({ visible: true, message, type }),

  hide: () => set({ visible: false }),
}));
