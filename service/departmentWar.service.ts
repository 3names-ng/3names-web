import { api } from './api';

// ── Types ──

export interface UserSummary {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePictureUrl: string | null;
}

export interface OpponentSearchResult extends UserSummary {
  departmentId: string | null;
  departmentName: string | null;
  stats: {
    totalBattles: number;
    wins: number;
    losses: number;
    winRate: number;
    currentWinStreak: number;
  };
}

export interface BattleQuestion {
  id: string;
  questionText: string;
  options: string[];
}

export type BattleType = 'quick_match' | 'challenge' | 'scheduled';
export type BattleStatus = 'waiting' | 'pending' | 'countdown' | 'active' | 'finished' | 'cancelled' | 'expired';

export interface Battle {
  id: string;
  type: BattleType;
  status: BattleStatus;
  player1Id: string;
  player2Id: string | null;
  player1Score: number;
  player2Score: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  timePerQuestion: number;
  winnerId: string | null;
  departmentPoints: number;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  player1?: UserSummary;
  player2?: UserSummary;
  /** Stats of the challenger (player1) — present on pending challenges */
  challengerStats?: {
    totalBattles: number;
    wins: number;
    losses: number;
    winRate: number;
    currentWinStreak: number;
    bestWinStreak: number;
  };
  /** Questions for the battle (included by /war/active for resume) */
  questions?: BattleQuestion[];
}

/**
 * Snapshot returned by GET /war/resume (and the war:battle_resumed socket
 * event) when a player reconnects mid-battle or after the battle ended.
 */
export type BattleResumePayload =
  | {
      status: 'none';
    }
  | {
      status: 'countdown' | 'active';
      battleId: string;
      questions: BattleQuestion[];
      totalQuestions: number;
      timePerQuestion: number;
      questionIndex: number;
      player1Id: string;
      player2Id: string | null;
      player1Score: number;
      player2Score: number;
      player1Answered: boolean;
      player2Answered: boolean;
      /** Seconds left on the current question (only when battle is ACTIVE) */
      timeLeft?: number;
    }
  | {
      status: 'finished';
      battleId: string;
      player1Id: string;
      player2Id: string | null;
      winnerId: string | null;
      player1Score: number;
      player2Score: number;
      departmentPoints: number;
      finishedAt: string | null;
    };

export interface UserWarStats {
  id: string;
  userId: string;
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  totalPointsEarned: number;
  currentWinStreak: number;
  bestWinStreak: number;
  totalCorrectAnswers: number;
  totalAnswersGiven: number;
  lastBattleAt: string | null;
}

export interface DeptWarStatsRow {
  id: string;
  departmentId: string;
  totalBattles: number;
  wins: number;
  losses: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  department?: { id: string; name: string };
}

export interface BattleHistoryItem {
  id: string;
  type: BattleType;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  finishedAt: string;
  player1?: UserSummary;
  player2?: UserSummary;
  winner?: UserSummary;
}

// ── API Calls ──

export const departmentWarService = {
  /** List online users available for a quick match, to pick from before sending a request */
  getQuickMatchCandidates: async (departmentId?: string) => {
    const res = await api.get('/war/quick-match/active-users', { params: { departmentId } });
    return res.data as OpponentSearchResult[];
  },

  /** Send a quick-match request — to a chosen opponent, or auto-matched if none given */
  findMatch: async (opponentId?: string, departmentId?: string) => {
    const res = await api.post('/war/matchmaking', { opponentId, departmentId });
    return res.data as { battleId: string; opponent: UserSummary; status: string };
  },

  /** Challenge a specific user */
  challenge: async (opponentId: string, options?: { totalQuestions?: number; timePerQuestion?: number }) => {
    const res = await api.post('/war/challenge', { opponentId, ...options });
    return res.data as { battleId: string; opponent: UserSummary; status: string };
  },

  /** Accept a challenge */
  acceptChallenge: async (battleId: string) => {
    const res = await api.post(`/war/accept/${battleId}`);
    return res.data as {
      battleId: string;
      status: string;
      questions: Array<{ id: string; questionText: string; options: string[] }>;
      totalQuestions: number;
      timePerQuestion: number;
    };
  },

  /** Reject a challenge */
  rejectChallenge: async (battleId: string) => {
    const res = await api.post(`/war/reject/${battleId}`);
    return res.data as { success: boolean };
  },

  /** Cancel a pending challenge you sent (challenger only) */
  cancelChallenge: async (battleId: string) => {
    const res = await api.post(`/war/cancel/${battleId}`);
    return res.data as { success: boolean };
  },

  /** Submit an answer */
  submitAnswer: async (battleId: string, questionIndex: number, selectedOption: number, timeTakenMs: number) => {
    const res = await api.post('/war/submit', { battleId, questionIndex, selectedOption, timeTakenMs });
    return res.data as {
      isCorrect: boolean;
      correctOption?: number;
      points: number;
      player1Score: number;
      player2Score: number;
      bothAnswered: boolean;
    };
  },

  /** Get the user's active battle */
  getActiveBattle: async () => {
    const res = await api.get('/war/active');
    return res.data as Battle | null;
  },

  /**
   * Get resume state after reconnecting: the active battle snapshot, the
   * recently-finished battle (so we can show "battle ended"), or none.
   */
  resumeBattle: async () => {
    const res = await api.get('/war/resume');
    return res.data as BattleResumePayload;
  },

  /** Get all incoming WAITING challenges where you are player2 */
  getPendingChallenges: async () => {
    const res = await api.get('/war/pending-challenges');
    return res.data as Battle[];
  },

  /** Schedule a battle */
  scheduleBattle: async (opponentId: string, scheduledAt: string, totalQuestions?: number) => {
    const res = await api.post('/war/schedule', { opponentId, scheduledAt, totalQuestions });
    return res.data as { battleId: string; scheduledAt: string; status: string };
  },

  /** Get scheduled battles */
  getScheduledBattles: async () => {
    const res = await api.get('/war/scheduled');
    return res.data as Battle[];
  },

  /** Cancel a scheduled battle (either player can cancel) */
  cancelScheduledBattle: async (battleId: string) => {
    const res = await api.post(`/war/cancel-scheduled/${battleId}`);
    return res.data as { success: boolean };
  },

  /** Search for opponents */
  searchOpponents: async (query: string, departmentId?: string) => {
    const res = await api.get('/war/search-opponents', { params: { q: query, departmentId } });
    return res.data as OpponentSearchResult[];
  },

  /** Get department leaderboard */
  getDeptLeaderboard: async () => {
    const res = await api.get('/war/dept-leaderboard');
    return res.data as DeptWarStatsRow[];
  },

  /** Get user leaderboard */
  getUserLeaderboard: async (departmentId?: string) => {
    const res = await api.get('/war/user-leaderboard', { params: { departmentId } });
    return res.data;
  },

  /** Get current user's war stats */
  getMyStats: async () => {
    const res = await api.get('/war/my-stats');
    return res.data as UserWarStats;
  },

  /** Get battle history */
  getHistory: async (limit = 20, cursor?: string) => {
    const res = await api.get('/war/history', { params: { limit, cursor } });
    return res.data as { battles: BattleHistoryItem[]; nextCursor: string | null };
  },
};
