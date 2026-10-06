// service/usePostsSocket.ts
//
// Listens for real-time post events (new posts, likes, comments, deletes)
// broadcast by the backend's PostsGateway ("/posts" namespace). Uses the
// SHARED socket connection from socketManager — no new socket per hook.

import { useEffect, useRef } from "react";
import { acquireNamespace, releaseNamespace } from "./socketManager";

interface SocketCallbacks {
  onPostCreated?: (post: any) => void;
  onPostLiked?: (data: { postId: string; likesCount: number; userId: string }) => void;
  onPostUnliked?: (data: { postId: string; likesCount: number; userId: string }) => void;
  onCommentAdded?: (data: { postId: string; commentsCount?: number; comment?: any }) => void;
  onPostDeleted?: (data: { postId: string }) => void;
}

export const usePostsSocket = (callbacks: SocketCallbacks = {}) => {
  const callbacksRef = useRef<SocketCallbacks>(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const socket = acquireNamespace("/posts");

    const onPostCreated = (post: any) => callbacksRef.current.onPostCreated?.(post);
    const onPostLiked = (data: any) => callbacksRef.current.onPostLiked?.(data);
    const onPostUnliked = (data: any) => callbacksRef.current.onPostUnliked?.(data);
    const onCommentAdded = (data: any) => callbacksRef.current.onCommentAdded?.(data);
    const onPostDeleted = (data: any) => callbacksRef.current.onPostDeleted?.(data);

    socket.on("post:created", onPostCreated);
    socket.on("post:liked", onPostLiked);
    socket.on("post:unliked", onPostUnliked);
    socket.on("comment:added", onCommentAdded);
    socket.on("post:deleted", onPostDeleted);

    return () => {
      socket.off("post:created", onPostCreated);
      socket.off("post:liked", onPostLiked);
      socket.off("post:unliked", onPostUnliked);
      socket.off("comment:added", onCommentAdded);
      socket.off("post:deleted", onPostDeleted);
      releaseNamespace("/posts");
    };
  }, []);

  return {};
};
