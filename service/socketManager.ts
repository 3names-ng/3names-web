/**
 * socketManager.ts
 *
 * Singleton manager for Socket.IO connections.
 * Instead of creating a new socket per hook (5+ connections!), we maintain
 * exactly ONE socket per namespace. Hooks share these connections via
 * reference counting — when the last hook using a namespace unmounts,
 * the socket disconnects.
 *
 * This fixes the "all sockets disconnect on gift send" issue caused by
 * overwhelming the server/ngrok with too many simultaneous connections.
 */

import { io, Socket } from "socket.io-client";
import { ENV } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { showError } from "@/components/ui/toast";

const SOCKET_ORIGIN = ENV.SOCKET_ORIGIN;

type Namespace = "/" | "/groups" | "/users" | "/gamification" | "/department-war" | "/coin-battle" | "/posts" | "/whot";

interface ManagedSocket {
  socket: Socket;
  refCount: number;
}

const sockets = new Map<Namespace, ManagedSocket>();

function getToken(): string | null {
  return useAuthStore.getState().token;
}

function buildHeaders(): Record<string, string> {
  const token = getToken();
  return {
    ...(SOCKET_ORIGIN.includes("ngrok") ? { "ngrok-skip-browser-warning": "true" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function createSocket(namespace: Namespace): Socket {
  const url = namespace === "/" ? SOCKET_ORIGIN : `${SOCKET_ORIGIN}${namespace}`;

  const socket = io(url, {
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    // Evaluated on every (re)connect, so a refreshed token or a different
    // signed-in user is always picked up.
    auth: (cb) => {
      const token = getToken();
      cb(token ? { token: `Bearer ${token}` } : {});
    },
    extraHeaders: buildHeaders(),
  });

  socket.io.on("reconnect_attempt", () => {
    socket.io.opts.extraHeaders = buildHeaders();
  });

  socket.on("connect", () => {
    console.log(`[SocketManager] ✅ Connected to ${namespace}, ID: ${socket.id}`);
  });

  socket.on("disconnect", (reason) => {
    console.warn(`[SocketManager] ⚠️ Disconnected from ${namespace}: ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error(`[SocketManager] ❌ Error on ${namespace}:`, err.message);
  });

  // The server disconnects a banned/suspended account's socket right after
  // connecting (see isSocketAccessBlocked on the API) — surface why instead
  // of letting chat/battle features just go silently dead.
  socket.on("auth:blocked", (data?: { reason?: string }) => {
    const reason = data?.reason;
    const message =
      reason === "banned"
        ? "This account has been banned."
        : reason === "suspended"
        ? "Real-time features are unavailable while your account is suspended."
        : "Connection rejected.";
    console.warn(`[SocketManager] 🚫 Blocked on ${namespace}: ${reason}`);
    showError(message);
  });

  return socket;
}

/**
 * Get (or create) a shared socket for the given namespace.
 * Call `releaseNamespace` when done to clean up.
 */
export function acquireNamespace(namespace: Namespace): Socket {
  const existing = sockets.get(namespace);
  if (existing) {
    existing.refCount++;
    // Ensure it's connected
    if (!existing.socket.connected) {
      existing.socket.io.opts.extraHeaders = buildHeaders();
      existing.socket.connect();
    }
    return existing.socket;
  }

  const socket = createSocket(namespace);
  sockets.set(namespace, { socket, refCount: 1 });
  return socket;
}

/**
 * Release a namespace. When no hooks reference it anymore, disconnect.
 */
export function releaseNamespace(namespace: Namespace): void {
  const managed = sockets.get(namespace);
  if (!managed) return;

  managed.refCount--;
  if (managed.refCount <= 0) {
    managed.socket.disconnect();
    sockets.delete(namespace);
  }
}

/**
 * Called on logout: drop every connection so nothing keeps running on the
 * previous user's session. Sockets stay registered (hooks still hold refs and
 * their listeners), so `reconnectAll` can bring them back after sign-in.
 */
export function disconnectAll(): void {
  sockets.forEach(({ socket }) => socket.disconnect());
}

/**
 * Called on sign-in: reconnect registered sockets with the new token. Forces
 * a fresh handshake even for connected sockets, since those were opened
 * before sign-in without credentials.
 */
export function reconnectAll(): void {
  sockets.forEach(({ socket }) => {
    if (socket.connected) socket.disconnect();
    socket.io.opts.extraHeaders = buildHeaders();
    socket.connect();
  });
}

/**
 * Get the underlying socket for a namespace without managing refs.
 * Useful for one-off emissions. Prefer acquireNamespace for long-lived hooks.
 */
export function getSocket(namespace: Namespace): Socket | null {
  return sockets.get(namespace)?.socket ?? null;
}

/**
 * Convenience: emit a "joinGroup" / "leaveGroup" on the groups socket.
 */
export function joinGroupRoom(groupId: string): void {
  const socket = getSocket("/groups");
  if (socket?.connected) {
    socket.emit("joinGroup", { groupId });
  }
}

export function leaveGroupRoom(groupId: string): void {
  const socket = getSocket("/groups");
  if (socket?.connected) {
    socket.emit("leaveGroup", { groupId });
  }
}
