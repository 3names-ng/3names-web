import { create } from "zustand";

interface BadgeStore {
  unreadNotificationCount: number;
  unreadChatCount: number;
  setUnreadNotificationCount: (count: number) => void;
  setUnreadChatCount: (count: number) => void;
  decrementNotificationCount: (by?: number) => void;
  decrementChatCount: (by?: number) => void;
}

export const useNotificationStore = create<BadgeStore>((set) => ({
  unreadNotificationCount: 0,
  unreadChatCount: 0,

  setUnreadNotificationCount: (count) =>
    set({ unreadNotificationCount: count }),

  setUnreadChatCount: (count) => set({ unreadChatCount: count }),

  decrementNotificationCount: (by = 1) =>
    set((state) => ({
      unreadNotificationCount: Math.max(0, state.unreadNotificationCount - by),
    })),

  decrementChatCount: (by = 1) =>
    set((state) => ({
      unreadChatCount: Math.max(0, state.unreadChatCount - by),
    })),
}));