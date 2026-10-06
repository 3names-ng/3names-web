// components/gift/RealTimeGiftHandler.tsx
//
// Connects the useGiftSocket hook to the GiftSendOverlay ref.
// Mount this alongside GiftSendOverlay wherever gifts should be
// received in real time (live stream screen, post detail, group chat).
//
// Usage:
//   <GiftSendOverlay ref={overlayRef} />
//   <RealTimeGiftHandler
//     overlayRef={overlayRef}
//     postId={postId}
//     groupId={groupId}
//   />

import React, { useEffect, useRef, useCallback } from "react";
import { useGiftSocket, GiftReceivedEvent } from "@/service/useGiftSocket";
import type { GiftSendOverlayRef } from "./GiftSendOverlay";
import type { Gifts as UIGift } from "./GiftGridItem";

interface RealTimeGiftHandlerProps {
  /** Ref to the GiftSendOverlay component */
  overlayRef: React.RefObject<GiftSendOverlayRef | null>;
  /** Post ID to listen for post gifts */
  postId?: string;
  /** Group ID to listen for group/DM gifts */
  groupId?: string;
}

/** Maps a server gift event to the UI gift shape expected by the overlay */
function mapServerGiftToUI(serverGift: GiftReceivedEvent["gift"]): UIGift {
  // Map rarity string to the expected rarity tier
  const getRarity = (coinCost: number, rarity?: string): string => {
    if (rarity) return rarity;
    if (coinCost >= 1000) return "legendary";
    if (coinCost >= 100) return "epic";
    return "rare";
  };

  return {
    id: serverGift.id,
    name: serverGift.name,
    icon: serverGift.icon || "🎁",
    coins: serverGift.coinCost,
    rarity: getRarity(serverGift.coinCost, serverGift.rarity),
    animationUrl: serverGift.animationUrl || "",
    videoUrl: serverGift.videoUrl,
  };
}

export default function RealTimeGiftHandler({
  overlayRef,
  postId,
  groupId,
}: RealTimeGiftHandlerProps) {
  const pendingGifts = useRef<GiftReceivedEvent[]>([]);
  const isAnimating = useRef(false);

  const processNextGift = useCallback(() => {
    if (isAnimating.current) return;
    if (pendingGifts.current.length === 0) return;

    const next = pendingGifts.current.shift();
    if (!next) return;

    isAnimating.current = true;
    const uiGift = mapServerGiftToUI(next.gift);
    overlayRef.current?.show(uiGift, next.senderName, next.comboCount ?? 1);

    // Reset after a delay to allow the next gift to animate
    // The overlay itself handles timing via video end + hold timer
    const resetTimer = setTimeout(() => {
      isAnimating.current = false;
      // Process next queued gift if any
      if (pendingGifts.current.length > 0) {
        processNextGift();
      }
    }, 3000);

    return () => clearTimeout(resetTimer);
  }, [overlayRef]);

  const handleGiftReceived = useCallback(
    (event: GiftReceivedEvent) => {
      // Queue the gift
      pendingGifts.current.push(event);

      // Try to process it now
      processNextGift();
    },
    [processNextGift],
  );

  const { giftQueue } = useGiftSocket({
    postId,
    groupId,
    onGiftReceived: handleGiftReceived,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pendingGifts.current = [];
      isAnimating.current = false;
    };
  }, []);

  // This component renders nothing — it only handles side effects
  return null;
}
