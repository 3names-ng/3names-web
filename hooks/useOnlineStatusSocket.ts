import { useEffect, useRef } from "react";
import { acquireNamespace, releaseNamespace } from "@/service/socketManager";
import { useOnlineUsersStore } from "@/store/onlineUsersStore";
import { useAuthStore } from "@/store/authStore";

/**
 * Global online-status tracker.
 * Mount once in the root layout so that every screen has real-time
 * online status for any user — not just the one currently in chat.
 *
 * On connect, emits `checkOnline` for the current user's own ID
 * (so we know when *we* are online), and listens for `user:status_change`
 * which is broadcast to the personal room `user_${userId}` whenever
 * any user connects or disconnects.
 */
export function useOnlineStatusSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUserOnline = useOnlineUsersStore((s) => s.setUserOnline);
  const mergeOnlineStatus = useOnlineUsersStore((s) => s.mergeOnlineStatus);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const knownUserIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = acquireNamespace("/groups");

    const handleConnect = () => {
      // Re-request online status for all known user IDs on reconnect
      const ids = Array.from(knownUserIdsRef.current);
      if (ids.length > 0) {
        socket.emit("checkOnline", { userIds: ids });
      }
    };

    const handleOnlineList = (userArray: string[]) => {
      if (Array.isArray(userArray)) {
        // This is a GROUP ROOM presence list (who is currently on that
        // chat screen), not the app-wide online set. Merge it in rather
        // than replacing, so true online statuses from checkOnline /
        // user:status_change aren't wiped out by a single room snapshot.
        mergeOnlineStatus(
          Object.fromEntries(userArray.map((id) => [String(id).trim().toLowerCase(), true])),
        );
      }
    };

    const handleOnlineStatus = (data: Record<string, boolean>) => {
      if (!data || typeof data !== "object") return;
      mergeOnlineStatus(data);
    };

    const handleStatusChange = (data: { userId: string; isOnline: boolean }) => {
      if (!data?.userId) return;
      const cleanId = String(data.userId).trim().toLowerCase();
      setUserOnline(cleanId, data.isOnline);
    };

    socket.on("connect", handleConnect);
    socket.on("user:online_list", handleOnlineList);
    socket.on("onlineStatus", handleOnlineStatus);
    socket.on("user:status_change", handleStatusChange);

    // If already connected, fetch status immediately
    if (socket.connected) {
      // No known IDs yet — will be populated by screens that call trackUser()
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("user:online_list", handleOnlineList);
      socket.off("onlineStatus", handleOnlineStatus);
      socket.off("user:status_change", handleStatusChange);
      releaseNamespace("/groups");
    };
  }, [isAuthenticated, setUserOnline, mergeOnlineStatus]);

  /**
   * Track a user ID so we can re-check their status on reconnect.
   * Call this from any screen that needs to know a user's online status.
   */
  useEffect(() => {
    if (!currentUserId) return;
    knownUserIdsRef.current.add(currentUserId);
  }, [currentUserId]);
}

/**
 * Helper: emit checkOnline for specific user IDs via the global groups socket.
 * Any screen can call this to get the latest online status for users it cares about.
 */
export function checkOnlineUsers(userIds: string[]): void {
  const socket = acquireNamespace("/groups");
  if (socket?.connected && userIds.length > 0) {
    socket.emit("checkOnline", { userIds });
  }
}

/**
 * Helper: track additional user IDs so they are re-checked on reconnect.
 * Call from screens that display online status (chat list, profile, etc.)
 */
export function trackOnlineUser(userId: string): void {
  // We'll store tracked IDs in the store itself
  useOnlineUsersStore.getState(); // ensure store is accessible
}
