import { create } from "zustand";

interface OnlineUsersState {
  /** Set of currently online user IDs (lowercased) */
  onlineUserIds: Set<string>;

  /** Bulk-set online IDs from an array (e.g. ONLINE_LIST event) */
  setOnlineUsers: (ids: string[]) => void;

  /** Update a single user's status from user:status_change */
  setUserOnline: (userId: string, isOnline: boolean) => void;

  /** Merge results from checkOnline response */
  mergeOnlineStatus: (data: Record<string, boolean>) => void;
}

export const useOnlineUsersStore = create<OnlineUsersState>((set) => ({
  onlineUserIds: new Set(),

  setOnlineUsers: (ids) =>
    set({
      onlineUserIds: new Set(ids.map((id) => String(id).trim().toLowerCase())),
    }),

  setUserOnline: (userId, isOnline) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      const cleanId = String(userId).trim().toLowerCase();
      if (isOnline) next.add(cleanId);
      else next.delete(cleanId);
      return { onlineUserIds: next };
    }),

  mergeOnlineStatus: (data) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      for (const [uid, online] of Object.entries(data)) {
        const cleanId = String(uid).trim().toLowerCase();
        if (online) next.add(cleanId);
        else next.delete(cleanId);
      }
      return { onlineUserIds: next };
    }),
}));
