import { useEffect, useRef, useCallback } from 'react';
import { acquireNamespace, releaseNamespace } from './socketManager';
import { useAuthStore } from '@/store/authStore';
import type { Socket } from 'socket.io-client';
import type { WhotSeat, WhotShape, WhotTableStatus } from './whot.service';

// ── Event names ──
// Server → Client event names are spelled out exactly in the shared plan
// (must match the NestJS whot.gateway.ts being built in parallel). Client →
// Server room join/leave use the unprefixed `join_table`/`leave_table` names
// the plan specifies for the `whot:<tableId>` room.
export const WhotEvents = {
  // Client → Server
  JOIN_TABLE: 'join_table',
  LEAVE_TABLE: 'leave_table',

  // Server → Client
  QUEUE_JOINED: 'whot:queue_joined',
  TABLE_UPDATE: 'whot:table_update',
  TABLE_START: 'whot:table_start',
  CARD_PLAYED: 'whot:card_played',
  CARD_DRAWN: 'whot:card_drawn',
  TURN_CHANGED: 'whot:turn_changed',
  TABLE_ENDED: 'whot:table_ended',
  PLAYER_DISCONNECTED: 'whot:player_disconnected',
  PLAYER_RECONNECTED: 'whot:player_reconnected',
  PLAYER_FORFEITED: 'whot:player_forfeited',
  LAST_CARD_CALLED: 'whot:last_card_called',
} as const;

// ── Payload types ──

export interface WhotQueueJoinedPayload {
  tableId: string;
  stake: number;
  maxPlayers: number;
  status: WhotTableStatus;
}

export interface WhotTableUpdatePayload {
  tableId: string;
  status: WhotTableStatus;
  stake: number;
  maxPlayers: number;
  minPlayers: number;
  pot: number;
  seats: WhotSeat[];
}

/** Sent once per socket right before a table goes ACTIVE — `yourHand` is
 * private to the recipient; everyone else only ever sees `seats[].cardCount`. */
export interface WhotTableStartPayload {
  tableId: string;
  yourHand: string[];
  seats: WhotSeat[];
  topCard: string;
  /** Cards remaining in the draw pile (never includes the discard pile). */
  deckCount: number;
  currentTurnPlayerId: string;
  turnDirection: 1 | -1;
  stake: number;
  pot: number;
  winnerPrize: number;
  platformFee: number;
}

export interface WhotCardPlayedPayload {
  tableId: string;
  userId: string;
  card: string;
  calledShape: WhotShape | null;
  topCard: string;
  currentTurnPlayerId: string;
  turnDirection: 1 | -1;
  pendingPickCount: number;
  requestedShape: WhotShape | null;
  seats: WhotSeat[];
  winnerId: string | null;
  deckCount: number;
}

/** Private per-socket event — `yourHand` is only present for the drawer. */
export interface WhotCardDrawnPayload {
  tableId: string;
  userId: string;
  cardCount: number;
  yourHand?: string[];
  pendingPickCount: number;
  currentTurnPlayerId: string;
  deckCount: number;
  seats: WhotSeat[];
  /** 'last_card_penalty' when the draw was a penalty for not calling Last Card */
  reason?: string;
}

export interface WhotTurnChangedPayload {
  tableId: string;
  currentTurnPlayerId: string;
  turnDirection: 1 | -1;
  pendingPickCount: number;
}

export interface WhotTableEndedPayload {
  tableId: string;
  /** Present when a table was voided (e.g. abandoned) instead of actually
   * finished — every escrowed player got their stake refunded, no winner. */
  cancelled?: boolean;
  reason?: string;
  winnerId?: string | null;
  /** Present instead of `winnerId` when the market ran out and 2+ players
   * tied for fewest cards — they split `winnerPrize` evenly. */
  winnerIds?: string[];
  stake?: number;
  pot?: number;
  winnerPrize?: number;
  platformFee?: number;
  seats?: WhotSeat[];
}

export interface WhotPlayerDisconnectedPayload {
  tableId: string;
  userId: string;
  /** When they forfeit if they haven't reconnected (ISO time) */
  forfeitAt?: string;
}

export interface WhotPlayerReconnectedPayload {
  tableId: string;
  userId: string;
}

/** A disconnected player didn't come back in time and is out of the game.
 * If that left one player, a `table_ended` naming them the winner follows. */
export interface WhotLastCardCalledPayload {
  tableId: string;
  userId: string;
  seats: WhotSeat[];
}

export interface WhotPlayerForfeitedPayload {
  tableId: string;
  userId: string;
  currentTurnPlayerId: string | null;
  pendingPickCount: number;
  seats: WhotSeat[];
}

// ── Hook ──
interface UseWhotSocketOptions {
  onQueueJoined?: (data: WhotQueueJoinedPayload) => void;
  onTableUpdate?: (data: WhotTableUpdatePayload) => void;
  onTableStart?: (data: WhotTableStartPayload) => void;
  onCardPlayed?: (data: WhotCardPlayedPayload) => void;
  onCardDrawn?: (data: WhotCardDrawnPayload) => void;
  onTurnChanged?: (data: WhotTurnChangedPayload) => void;
  onTableEnded?: (data: WhotTableEndedPayload) => void;
  onPlayerDisconnected?: (data: WhotPlayerDisconnectedPayload) => void;
  onPlayerReconnected?: (data: WhotPlayerReconnectedPayload) => void;
  onPlayerForfeited?: (data: WhotPlayerForfeitedPayload) => void;
  onLastCardCalled?: (data: WhotLastCardCalledPayload) => void;
}

export function useWhotSocket(options: UseWhotSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((state) => state.token);

  // Latest-callback ref, kept in sync from an effect (never during render) so
  // the socket handlers always invoke the caller's current props without
  // forcing the socket effect to tear down and re-subscribe on every render.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!token) return;

    const socket = acquireNamespace('/whot');
    socketRef.current = socket;

    if (socket.connected) {
      console.log('✅ [Whot Socket] Connected:', socket.id);
    }

    const onConnect = () => {
      console.log('✅ [Whot Socket] Connected:', socket.id);
    };

    const onDisconnect = (reason: string) => {
      console.warn('⚠️ [Whot Socket] Disconnected:', reason);
    };

    const onQueueJoined = (data: WhotQueueJoinedPayload) => {
      optionsRef.current.onQueueJoined?.(data);
    };

    const onTableUpdate = (data: WhotTableUpdatePayload) => {
      optionsRef.current.onTableUpdate?.(data);
    };

    const onTableStart = (data: WhotTableStartPayload) => {
      optionsRef.current.onTableStart?.(data);
    };

    const onCardPlayed = (data: WhotCardPlayedPayload) => {
      optionsRef.current.onCardPlayed?.(data);
    };

    const onCardDrawn = (data: WhotCardDrawnPayload) => {
      optionsRef.current.onCardDrawn?.(data);
    };

    const onTurnChanged = (data: WhotTurnChangedPayload) => {
      optionsRef.current.onTurnChanged?.(data);
    };

    const onTableEnded = (data: WhotTableEndedPayload) => {
      optionsRef.current.onTableEnded?.(data);
    };

    const onPlayerDisconnected = (data: WhotPlayerDisconnectedPayload) => {
      optionsRef.current.onPlayerDisconnected?.(data);
    };

    const onPlayerReconnected = (data: WhotPlayerReconnectedPayload) => {
      optionsRef.current.onPlayerReconnected?.(data);
    };

    const onPlayerForfeited = (data: WhotPlayerForfeitedPayload) => {
      optionsRef.current.onPlayerForfeited?.(data);
    };

    const onLastCardCalled = (data: WhotLastCardCalledPayload) => {
      optionsRef.current.onLastCardCalled?.(data);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(WhotEvents.QUEUE_JOINED, onQueueJoined);
    socket.on(WhotEvents.TABLE_UPDATE, onTableUpdate);
    socket.on(WhotEvents.TABLE_START, onTableStart);
    socket.on(WhotEvents.CARD_PLAYED, onCardPlayed);
    socket.on(WhotEvents.CARD_DRAWN, onCardDrawn);
    socket.on(WhotEvents.TURN_CHANGED, onTurnChanged);
    socket.on(WhotEvents.TABLE_ENDED, onTableEnded);
    socket.on(WhotEvents.PLAYER_DISCONNECTED, onPlayerDisconnected);
    socket.on(WhotEvents.PLAYER_RECONNECTED, onPlayerReconnected);
    socket.on(WhotEvents.PLAYER_FORFEITED, onPlayerForfeited);
    socket.on(WhotEvents.LAST_CARD_CALLED, onLastCardCalled);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(WhotEvents.QUEUE_JOINED, onQueueJoined);
      socket.off(WhotEvents.TABLE_UPDATE, onTableUpdate);
      socket.off(WhotEvents.TABLE_START, onTableStart);
      socket.off(WhotEvents.CARD_PLAYED, onCardPlayed);
      socket.off(WhotEvents.CARD_DRAWN, onCardDrawn);
      socket.off(WhotEvents.TURN_CHANGED, onTurnChanged);
      socket.off(WhotEvents.TABLE_ENDED, onTableEnded);
      socket.off(WhotEvents.PLAYER_DISCONNECTED, onPlayerDisconnected);
      socket.off(WhotEvents.PLAYER_RECONNECTED, onPlayerReconnected);
      socket.off(WhotEvents.PLAYER_FORFEITED, onPlayerForfeited);
      socket.off(WhotEvents.LAST_CARD_CALLED, onLastCardCalled);

      releaseNamespace('/whot');
      socketRef.current = null;
    };
  }, [token]);

  // Play/draw actions go through whot.service.ts (REST) — the server's
  // REST-for-actions + socket-for-broadcast split (same as Coin Battle's
  // submitAnswer via REST, score_update via socket). This hook only emits
  // the room join/leave events and receives broadcasts.
  const joinTableRoom = useCallback((tableId: string) => {
    socketRef.current?.emit(WhotEvents.JOIN_TABLE, { tableId });
  }, []);

  const leaveTableRoom = useCallback((tableId: string) => {
    socketRef.current?.emit(WhotEvents.LEAVE_TABLE, { tableId });
  }, []);

  return { joinTableRoom, leaveTableRoom };
}
