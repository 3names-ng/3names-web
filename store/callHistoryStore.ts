import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CallHistoryRecord {
  id: string;
  callType: "video" | "audio";
  status: "missed" | "rejected" | "accepted" | "cancelled";
  duration: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  isIncoming: boolean;
  otherUser: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
}

interface CallHistoryState {
  calls: CallHistoryRecord[];
  missedCallCount: number;
  setCalls: (calls: CallHistoryRecord[]) => void;
  addCalls: (calls: CallHistoryRecord[]) => void;
  clearHistory: () => void;
  clearMissedCalls: () => void;
}

export const useCallHistoryStore = create<CallHistoryState>()(
  persist(
    (set, get) => ({
      calls: [],
      missedCallCount: 0,

      setCalls: (calls) => {
        const missed = calls.filter((c) => c.status === "missed" && c.isIncoming).length;
        set({ calls, missedCallCount: missed });
      },

      addCalls: (newCalls) => {
        const existing = get().calls;
        const existingIds = new Set(existing.map((c) => c.id));
        const merged = [
          ...newCalls.filter((c) => !existingIds.has(c.id)),
          ...existing,
        ].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        set({ calls: merged });
      },

      clearHistory: () => set({ calls: [], missedCallCount: 0 }),

      clearMissedCalls: () => set({ missedCallCount: 0 }),
    }),
    {
      name: "call-history-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
