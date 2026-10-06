import { useEffect, useRef } from "react";
import { acquireNamespace, releaseNamespace } from "./socketManager";

export interface LevelUpEvent {
  userId: string;
  username: string | null;
  profilePictureUrl: string | null;
  level: number;
  title: string;
  emoji: string;
  color: string;
  badge: string;
}

interface GamificationSocketCallbacks {
  onUserLeveledUp?: (data: LevelUpEvent) => void;
}

export const useGamificationSocket = (
  callbacks: GamificationSocketCallbacks = {}
) => {
  const callbacksRef = useRef<GamificationSocketCallbacks>(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const socket = acquireNamespace("/gamification");

    const handleLevelUp = (data: LevelUpEvent) => {
      callbacksRef.current.onUserLeveledUp?.(data);
    };

    socket.on("user:leveled_up", handleLevelUp);

    return () => {
      socket.off("user:leveled_up", handleLevelUp);
      releaseNamespace("/gamification");
    };
  }, []);
};
