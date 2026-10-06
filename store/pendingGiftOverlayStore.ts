// store/pendingGiftOverlayStore.ts
//
// Holds a pending gift overlay event that arrived via push notification
// while the chat screen was not mounted. When the chat screen mounts or
// focuses, it checks this store and shows the overlay if there's a
// pending gift for the current conversation.

import { create } from "zustand";

export interface PendingGiftOverlay {
  senderId?: string;
  senderName: string;
  giftName: string;
  giftIcon: string;
  giftId?: string;
  giftVideoUrl: string;
  giftAnimationUrl?: string;
  giftCoinCost?: number;
  giftRarity?: string;
  /** The group/conversation ID this gift belongs to (null = unknown). */
  groupId?: string;
  /** Timestamp to prevent stale events from showing. */
  receivedAt: number;
}

interface PendingGiftOverlayState {
  /** The most recent pending gift overlay event, if any. */
  pendingGift: PendingGiftOverlay | null;
  /** Set a pending gift overlay (called by push notification handler). */
  setPendingGift: (gift: PendingGiftOverlay) => void;
  /** Consume the pending gift overlay (called by chat screen after showing it). */
  consumePendingGift: () => void;
}

export const usePendingGiftOverlayStore = create<PendingGiftOverlayState>()(
  (set, get) => ({
    pendingGift: null,

    setPendingGift: (gift) => {
      set({ pendingGift: gift });
    },

    consumePendingGift: () => {
      set({ pendingGift: null });
    },
  }),
);
