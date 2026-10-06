import { useEffect, useRef, useCallback } from "react";
import { acquireNamespace, releaseNamespace, joinGroupRoom, leaveGroupRoom, getSocket } from "./socketManager";

export interface GroupSocketCallbacks {
  onNewMessage?: (message: any) => void;
  onUserJoined?: (data: { userId: string; groupId: string }) => void;
  onUserLeft?: (data: { userId: string; groupId: string }) => void;
  onTypingStart?: (data: { userId: string; username?: string }) => void;
  onTypingStop?: (data: { userId: string }) => void;
}

export const useGroupSocket = (
  groupId?: string,
  callbacks: GroupSocketCallbacks = {}
) => {
  const callbacksRef = useRef<GroupSocketCallbacks>(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    // Acquire the shared /groups socket
    const socket = acquireNamespace("/groups");

    // Auto-join group room
    if (groupId) {
      console.log(`[GroupSocket] Joining room for groupId: ${groupId}`);
      joinGroupRoom(groupId);
    }

    // Event handlers
    const handleMessage = (data: any) => callbacksRef.current.onNewMessage?.(data);
    const handleUserJoined = (data: any) => callbacksRef.current.onUserJoined?.(data);
    const handleUserLeft = (data: any) => callbacksRef.current.onUserLeft?.(data);
    const handleTypingStart = (data: any) => callbacksRef.current.onTypingStart?.(data);
    const handleTypingStop = (data: any) => callbacksRef.current.onTypingStop?.(data);

    socket.on("message:new", handleMessage);
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handleUserLeft);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      if (groupId) {
        leaveGroupRoom(groupId);
      }
      socket.off("message:new", handleMessage);
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handleUserLeft);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      releaseNamespace("/groups");
    };
  }, [groupId]);

  const sendMessage = useCallback((content: string, payload: Record<string, any> = {}) => {
    const socket = getSocket("/groups");
    if (socket?.connected && groupId) {
      socket.emit("sendMessage", {
        groupId,
        content,
        ...payload,
      });
    }
  }, [groupId]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    const socket = getSocket("/groups");
    if (socket?.connected && groupId) {
      const event = isTyping ? "typing:start" : "typing:stop";
      socket.emit(event, { groupId });
    }
  }, [groupId]);

  return {
    get socket() { return getSocket("/groups"); },
    sendMessage,
    sendTypingStatus,
  };
};
