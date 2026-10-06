import { api } from './api';

// ── Types ──

export type CoinBattleStake = 50 | 100 | 250 | 500;

export interface CoinBattle {
  id: string;
  status: string;
  stake: number;
  pot: number;
  platformFee: number;
  winnerPrize: number;
  player1Id: string;
  player2Id: string | null;
  player1Score: number;
  player2Score: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  timePerQuestion: number;
  winnerId: string | null;
  player1Escrowed: boolean;
  player2Escrowed: boolean;
  selectedQuestionIds: string[] | null;
  startedAt: string | null;
  finishedAt: string | null;
  queuedAt: string | null;
  createdAt: string;
  player1?: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
  player2?: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
  winner?: {
    id: string;
    username: string | null;
    firstName: string | null;
    profilePictureUrl: string | null;
  } | null;
}

export interface CoinBattleAnswerPayload {
  battleId: string;
  questionIndex: number;
  selectedOption: number;
  timeTakenMs?: number;
}

export interface CoinActiveUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
  balance: number;
}

export interface PendingCoinChallenge {
  id: string;
  stake: number;
  pot: number;
  winnerPrize: number;
  platformFee: number;
  challenger: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  } | null;
  expiresAt: string | null;
}

export interface CoinChallengeResult {
  battleId: string;
  opponent: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  } | null;
  stake: number;
  pot: number;
  winnerPrize: number;
  platformFee: number;
  status: string;
}

export interface CoinBattleHistoryResponse {
  battles: CoinBattle[];
  nextCursor: string | null;
}

// ── API calls ──

export const coinBattleService = {
  /** List online users who can afford the stake and can be challenged */
  getActiveUsers: async (stake: CoinBattleStake) => {
    const response = await api.get('/coin-battle/active-users', {
      params: { stake },
    });
    return response.data as CoinActiveUser[];
  },

  /** Send a coin battle challenge to a specific opponent for a stake */
  challenge: async (opponentId: string, stake: CoinBattleStake) => {
    const response = await api.post('/coin-battle/challenge', { opponentId, stake });
    return response.data as CoinChallengeResult;
  },

  /** Accept an incoming coin battle challenge */
  acceptChallenge: async (battleId: string) => {
    const response = await api.post(`/coin-battle/accept/${battleId}`);
    return response.data as {
      battleId: string;
      status: string;
      questions: Array<{ id: string; questionText: string; options: string[] }>;
      totalQuestions: number;
      timePerQuestion: number;
      stake: number;
      pot: number;
      winnerPrize: number;
      platformFee: number;
    };
  },

  /** Reject an incoming coin battle challenge */
  rejectChallenge: async (battleId: string) => {
    const response = await api.post(`/coin-battle/reject/${battleId}`);
    return response.data as { success: boolean };
  },

  /** Cancel a pending challenge you sent */
  cancelChallenge: async (battleId: string) => {
    const response = await api.post(`/coin-battle/cancel/${battleId}`);
    return response.data as { success: boolean };
  },

  /** Get incoming WAITING challenges */
  getPendingChallenges: async () => {
    const response = await api.get('/coin-battle/pending-challenges');
    return response.data as PendingCoinChallenge[];
  },

  /** Join the matchmaking queue with a coin stake */
  /** Join the matchmaking queue with a coin stake */
  joinQueue: async (stake: CoinBattleStake) => {
    const response = await api.post('/coin-battle/queue/join', { stake });
    return response.data as { battleId: string; stake: number; status: string };
  },

  /** Leave the matchmaking queue and get refund */
  leaveQueue: async () => {
    const response = await api.post('/coin-battle/queue/leave');
    return response.data as { success: boolean };
  },

  /** Submit an answer during a coin battle */
  submitAnswer: async (payload: CoinBattleAnswerPayload) => {
    const response = await api.post('/coin-battle/submit', payload);
    return response.data as {
      isCorrect: boolean;
      correctOption?: number;
      points: number;
      player1Score: number;
      player2Score: number;
      bothAnswered: boolean;
    };
  },

  /** Get current active coin battle */
  getActiveBattle: async () => {
    const response = await api.get('/coin-battle/active');
    return response.data as CoinBattle | null;
  },

  /** Get paginated battle history */
  getHistory: async (limit = 20, cursor?: string) => {
    const response = await api.get('/coin-battle/history', {
      params: { limit, cursor },
    });
    return response.data as CoinBattleHistoryResponse;
  },

  /** Get queue stats for a stake */
  getQueueStats: async (stake: number) => {
    const response = await api.get(`/coin-battle/queue/stats/${stake}`);
    return response.data as { stake: number; playersInQueue: number };
  },
};
