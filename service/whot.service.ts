import { api } from './api';

// ── Types ──

/** Same stake tiers as Coin Battle. */
export type WhotStake = 50 | 100 | 250 | 500;

/** Table sizes supported by Naija Whot (independent of stake). */
export type WhotTableSize = 2 | 3 | 4;

/** Card codes are "<shape>-<number>", e.g. "circle-5", or "whot-20" for wild cards. */
export type WhotShape = 'circle' | 'triangle' | 'cross' | 'square' | 'star';

/** Lowercase — must match the server's WhotTableStatus enum values exactly. */
export type WhotTableStatus =
  | 'waiting'
  | 'queued'
  | 'matched'
  | 'countdown'
  | 'active'
  | 'finished'
  | 'cancelled'
  | 'expired';

/** Public seat info — never includes the seat's hidden hand. */
export interface WhotSeat {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  seatIndex: number;
  cardCount: number;
  isActive: boolean;
  /** Announced "Last Card" while holding one card */
  hasCalledLastCard: boolean;
}

export interface WhotTable {
  id: string;
  status: WhotTableStatus;
  stake: number;
  pot: number;
  platformFee: number;
  winnerPrize: number;
  maxPlayers: number;
  minPlayers: number;
  seats: WhotSeat[];
  /** Top of the discard pile (last element of the server's discardPile array). */
  topCard: string | null;
  /** Cards remaining in the draw pile. */
  deckCount: number;
  /** Present only when this table's `publicTableSummary` was built for the
   * calling user (e.g. via getActiveTable) — their own hidden hand. */
  yourHand?: string[];
  currentTurnPlayerId: string | null;
  turnDirection: 1 | -1;
  pendingPickCount: number;
  requestedShape: WhotShape | null;
  winnerId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  queuedAt: string | null;
  createdAt: string;
}

export interface WhotHistoryResponse {
  tables: WhotTable[];
  nextCursor: string | null;
}

export interface WhotQueueJoinResult {
  tableId: string;
  stake: number;
  maxPlayers: number;
  status: WhotTableStatus;
}

export interface WhotQueueStats {
  stake: number;
  maxPlayers: number;
  playersInQueue: number;
}

// ── API calls ──
// Endpoint names mirror the shared plan exactly (must match the NestJS
// `whot.controller.ts` being built in parallel from the same spec).

export const whotService = {
  /** Join (or create) a public matchmaking table for a (stake, maxPlayers) pair. */
  joinQueue: async (stake: WhotStake, maxPlayers: WhotTableSize) => {
    const response = await api.post('/whot/queue/join', { stake, maxPlayers });
    return response.data as WhotQueueJoinResult;
  },

  /** Leave the matchmaking queue and get refunded. */
  leaveQueue: async () => {
    const response = await api.post('/whot/queue/leave');
    return response.data as { success: boolean };
  },

  /**
   * Play a card. `calledShape` is required only when playing a Whot-20 wild
   * card. The server is the sole authority on legality — this is purely a
   * REST action; the resulting state broadcasts arrive over the /whot socket
   * (`whot:card_played`, `whot:turn_changed`, etc.), same REST-for-actions +
   * socket-for-broadcast split Coin Battle uses for submitAnswer/score_update.
   */
  playCard: async (tableId: string, card: string, calledShape?: WhotShape) => {
    const response = await api.post('/whot/play', { tableId, card, calledShape });
    return response.data as { success: boolean };
  },

  /** Call "Last Card" — required before playing your final card, or you draw a penalty. */
  callLastCard: async (tableId: string) => {
    const response = await api.post('/whot/last-card', { tableId });
    return response.data as { success: boolean };
  },

  /** Draw a card from the pile (also resolves any pendingPickCount owed). */
  drawCard: async (tableId: string) => {
    const response = await api.post('/whot/draw', { tableId });
    return response.data as { success: boolean };
  },

  /** Start a 1v1 table against the "Computer" opponent — no queue, starts immediately. */
  startBotTable: async (stake: WhotStake) => {
    const response = await api.post('/whot/bot/start', { stake });
    return response.data as WhotQueueJoinResult;
  },

  /** Get the caller's current active/in-progress table, if any. */
  getActiveTable: async () => {
    const response = await api.get('/whot/active');
    return response.data as WhotTable | null;
  },

  /** Paginated table history. */
  getHistory: async (limit = 20, cursor?: string) => {
    const response = await api.get('/whot/history', {
      params: { limit, cursor },
    });
    return response.data as WhotHistoryResponse;
  },

  /** Queue stats for a given stake — how many players are waiting, keyed by (stake, maxPlayers). */
  getQueueStats: async (stake: WhotStake, maxPlayers: WhotTableSize) => {
    const response = await api.get(`/whot/queue/stats/${stake}`, {
      params: { maxPlayers },
    });
    return response.data as WhotQueueStats;
  },
};
