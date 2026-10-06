import { create } from 'zustand';
import type { WhotSeat, WhotShape, WhotTable, WhotTableStatus } from '@/service/whot.service';
import type {
  WhotCardDrawnPayload,
  WhotCardPlayedPayload,
  WhotLastCardCalledPayload,
  WhotPlayerForfeitedPayload,
  WhotTableEndedPayload,
  WhotTableStartPayload,
  WhotTableUpdatePayload,
  WhotTurnChangedPayload,
} from '@/service/useWhotSocket';

/** Removes the first occurrence of `card` from `hand`, leaving duplicates intact. */
function removeOneCard(hand: string[], card: string): string[] {
  const idx = hand.indexOf(card);
  if (idx === -1) return hand;
  const next = hand.slice();
  next.splice(idx, 1);
  return next;
}

interface WhotLastResult {
  winnerId: string | null;
  /** Present when the market ran out and 2+ players tied for fewest cards. */
  winnerIds?: string[];
  stake: number;
  pot: number;
  winnerPrize: number;
  platformFee: number;
  /** True when the table was voided (e.g. abandoned) rather than actually won/lost — everyone got their stake back. */
  cancelled?: boolean;
}

interface WhotState {
  // Queue state
  isQueued: boolean;
  queuedStake: number | null;
  queuedMaxPlayers: number | null;

  // Table state (server-authoritative — every field here is set from an
  // incoming socket payload, never predicted client-side beyond a temporary
  // UI hint that gets overwritten the moment the real event lands)
  tableId: string | null;
  status: WhotTableStatus | null;
  stake: number;
  maxPlayers: number;
  minPlayers: number;
  pot: number;
  platformFee: number;
  winnerPrize: number;
  seats: WhotSeat[];
  myHand: string[];
  topCard: string | null;
  /** Cards remaining in the draw pile. */
  deckCount: number;
  currentTurnPlayerId: string | null;
  turnDirection: 1 | -1;
  pendingPickCount: number;
  requestedShape: WhotShape | null;
  winnerId: string | null;

  /** Seated players whose connection dropped mid-game and haven't come back
   * yet → when they forfeit (ISO time, null if unknown) */
  disconnectedPlayers: Record<string, string | null>;

  // Result
  lastResult: WhotLastResult | null;

  // Actions
  setQueued: (isQueued: boolean, stake?: number | null, maxPlayers?: number | null) => void;
  setTableId: (tableId: string | null) => void;
  /** Hydrates the whole table state from a REST snapshot (e.g. getActiveTable
   * on resume) — the socket events are the only other source of full state. */
  applyTableSnapshot: (data: WhotTable) => void;
  applyTableUpdate: (data: WhotTableUpdatePayload) => void;
  applyTableStart: (data: WhotTableStartPayload) => void;
  applyCardPlayed: (data: WhotCardPlayedPayload, myUserId: string | null) => void;
  applyCardDrawn: (data: WhotCardDrawnPayload) => void;
  applyTurnChanged: (data: WhotTurnChangedPayload) => void;
  applyTableEnded: (data: WhotTableEndedPayload) => void;
  setPlayerConnected: (userId: string, connected: boolean, forfeitAt?: string | null) => void;
  applyPlayerForfeited: (data: WhotPlayerForfeitedPayload) => void;
  applyLastCardCalled: (data: WhotLastCardCalledPayload) => void;
  resetTable: () => void;
}

const initialState = {
  isQueued: false,
  queuedStake: null as number | null,
  queuedMaxPlayers: null as number | null,

  tableId: null as string | null,
  status: null as WhotTableStatus | null,
  stake: 0,
  maxPlayers: 0,
  minPlayers: 0,
  pot: 0,
  platformFee: 0,
  winnerPrize: 0,
  seats: [] as WhotSeat[],
  myHand: [] as string[],
  topCard: null as string | null,
  deckCount: 0,
  currentTurnPlayerId: null as string | null,
  turnDirection: 1 as 1 | -1,
  pendingPickCount: 0,
  requestedShape: null as WhotShape | null,
  winnerId: null as string | null,

  disconnectedPlayers: {} as Record<string, string | null>,

  lastResult: null as WhotLastResult | null,
};

export const useWhotStore = create<WhotState>((set) => ({
  ...initialState,

  setQueued: (isQueued, stake = null, maxPlayers = null) =>
    set({ isQueued, queuedStake: stake, queuedMaxPlayers: maxPlayers }),

  setTableId: (tableId) => set({ tableId }),

  applyTableSnapshot: (data) =>
    set((state) => ({
      tableId: data.id,
      status: data.status,
      stake: data.stake,
      maxPlayers: data.maxPlayers,
      minPlayers: data.minPlayers,
      pot: data.pot,
      platformFee: data.platformFee,
      winnerPrize: data.winnerPrize,
      seats: data.seats,
      myHand: data.yourHand ?? state.myHand,
      topCard: data.topCard,
      deckCount: data.deckCount,
      currentTurnPlayerId: data.currentTurnPlayerId,
      turnDirection: data.turnDirection,
      pendingPickCount: data.pendingPickCount,
      requestedShape: data.requestedShape,
      winnerId: data.winnerId,
    })),

  applyTableUpdate: (data) =>
    set({
      tableId: data.tableId,
      status: data.status,
      stake: data.stake,
      maxPlayers: data.maxPlayers,
      minPlayers: data.minPlayers,
      pot: data.pot,
      seats: data.seats,
    }),

  applyTableStart: (data) =>
    // notifyTableStart fires a room-wide broadcast without `yourHand` first,
    // then a private per-socket emit with it right after — both land here as
    // separate `table_start` events, so never let the hand-less one clobber
    // a hand we already have.
    set((state) => ({
      tableId: data.tableId,
      status: 'active',
      stake: data.stake,
      pot: data.pot,
      winnerPrize: data.winnerPrize,
      platformFee: data.platformFee,
      seats: data.seats,
      myHand: data.yourHand ?? state.myHand,
      topCard: data.topCard,
      deckCount: data.deckCount,
      currentTurnPlayerId: data.currentTurnPlayerId,
      turnDirection: data.turnDirection,
      pendingPickCount: 0,
      requestedShape: null,
      winnerId: null,
      isQueued: false,
    })),

  applyCardPlayed: (data, myUserId) =>
    set((state) => ({
      topCard: data.topCard,
      deckCount: data.deckCount,
      currentTurnPlayerId: data.currentTurnPlayerId,
      turnDirection: data.turnDirection,
      pendingPickCount: data.pendingPickCount,
      requestedShape: data.requestedShape,
      seats: data.seats,
      winnerId: data.winnerId,
      status: data.winnerId ? 'finished' : state.status,
      // Optimistic-but-corrected: if it was our own play, drop the card from
      // our hand locally. Any future table_start/card_drawn payload with a
      // fresh yourHand always overwrites this — server stays authoritative.
      myHand: data.userId === myUserId ? removeOneCard(state.myHand, data.card) : state.myHand,
    })),

  applyCardDrawn: (data) =>
    set((state) => ({
      pendingPickCount: data.pendingPickCount,
      currentTurnPlayerId: data.currentTurnPlayerId,
      deckCount: data.deckCount,
      seats: data.seats,
      myHand: data.yourHand ?? state.myHand,
    })),

  applyTurnChanged: (data) =>
    set({
      currentTurnPlayerId: data.currentTurnPlayerId,
      turnDirection: data.turnDirection,
      pendingPickCount: data.pendingPickCount,
    }),

  applyTableEnded: (data) =>
    set((state) => ({
      status: data.cancelled ? 'cancelled' : 'finished',
      winnerId: data.winnerId ?? null,
      seats: data.seats ?? state.seats,
      lastResult: {
        winnerId: data.winnerId ?? null,
        winnerIds: data.winnerIds,
        stake: data.stake ?? state.stake,
        pot: data.pot ?? state.pot,
        winnerPrize: data.winnerPrize ?? state.winnerPrize,
        platformFee: data.platformFee ?? 0,
        cancelled: data.cancelled,
      },
    })),

  setPlayerConnected: (userId, connected, forfeitAt = null) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.disconnectedPlayers;
      return { disconnectedPlayers: connected ? rest : { ...rest, [userId]: forfeitAt } };
    }),

  applyLastCardCalled: (data) => set({ seats: data.seats }),

  applyPlayerForfeited: (data) =>
    set((state) => {
      const { [data.userId]: _, ...rest } = state.disconnectedPlayers;
      return {
        disconnectedPlayers: rest,
        seats: data.seats,
        currentTurnPlayerId: data.currentTurnPlayerId ?? state.currentTurnPlayerId,
        pendingPickCount: data.pendingPickCount,
      };
    }),

  resetTable: () => set(initialState),
}));
