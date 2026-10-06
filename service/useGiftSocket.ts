// service/useGiftSocket.ts
//
// Listens for real-time gift:sent events via the SHARED socket connections
// (from socketManager). No new sockets are created — this hook just acquires
// references to the already-open /posts and /groups sockets and registers
// gift listeners on them.

import { useEffect, useRef, useCallback, useState } from "react";
import { acquireNamespace, releaseNamespace, joinGroupRoom, leaveGroupRoom } from "./socketManager";
import { useAuthStore } from "@/store/authStore";

export interface GiftReceivedEvent {
  senderId: string;
  senderName: string;
  recipientId: string;
  gift: {
    id: string;
    name: string;
    icon: string;
    coinCost: number;
    rarity: string;
    animationUrl?: string;
    videoUrl?: string;
  };
  comboCount?: number;
}

interface UseGiftSocketOptions {
  postId?: string;
  groupId?: string;
  onGiftReceived?: (event: GiftReceivedEvent) => void;
}

interface UseGiftSocketResult {
  giftQueue: GiftReceivedEvent[];
  clearGiftQueue: () => void;
  popGift: () => GiftReceivedEvent | undefined;
}

export function useGiftSocket({
  postId,
  groupId,
  onGiftReceived,
}: UseGiftSocketOptions): UseGiftSocketResult {
  const [giftQueue, setGiftQueue] = useState<GiftReceivedEvent[]>([]);
  const callbackRef = useRef(onGiftReceived);

  useEffect(() => {
    callbackRef.current = onGiftReceived;
  }, [onGiftReceived]);

  const handleGift = useCallback((event: GiftReceivedEvent) => {
    // Ignore gifts sent by the current user (they're handled locally)
    const currentUserId = useAuthStore.getState().user?.id;
    if (event.senderId === currentUserId) return;

    setGiftQueue((prev) => [...prev, event]);
    callbackRef.current?.(event);
  }, []);


  // ── Groups socket ──────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;

    // Reuse the shared /groups socket (same one useGroupSocket uses)
    const socket = acquireNamespace("/groups");

    const onGiftSent = (data: GiftReceivedEvent) => {
      console.log("[GiftSocket:Groups] Gift received:", data.gift?.name);
      handleGift(data);
    };

    socket.on("gift:sent", onGiftSent);

    // Join the group room so we receive events for this group
    joinGroupRoom(groupId);

    return () => {
      socket.off("gift:sent", onGiftSent);
      leaveGroupRoom(groupId);
      releaseNamespace("/groups");
    };
  }, [groupId, handleGift]);

  const clearGiftQueue = useCallback(() => {
    setGiftQueue([]);
  }, []);

  const popGift = useCallback(() => {
    let popped: GiftReceivedEvent | undefined;
    setGiftQueue((prev) => {
      popped = prev[0];
      return prev.slice(1);
    });
    return popped;
  }, []);

  return { giftQueue, clearGiftQueue, popGift };
}
