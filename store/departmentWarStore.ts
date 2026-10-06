import { create } from 'zustand';
import type {
  Battle,
  BattleQuestion,
  UserWarStats,
  OpponentSearchResult,
  BattleHistoryItem,
  DeptWarStatsRow,
} from '@/service/departmentWar.service';
import type { ChallengeSentPayload } from '@/service/useWarSocket';

// ── Battle state ──

export type BattlePhase = 'idle' | 'lobby' | 'searching' | 'countdown' | 'answering' | 'results';

interface QuestionState {
  questionIndex: number;
  selectedOption: number | null;
  timeRemaining: number;
  result: 'correct' | 'wrong' | 'failed' | null;
  correctOption: number | null;
}

interface DepartmentWarState {
  // ── Current battle ──
  battlePhase: BattlePhase;
  activeBattle: Battle | null;
  questions: BattleQuestion[];
  currentQuestion: QuestionState;

  // ── Scores ──
  myScore: number;
  opponentScore: number;

  // ── Opponent ──
  opponentInfo: { id: string; username: string | null; firstName: string | null; profilePictureUrl: string | null } | null;

  // ── Matchmaking ──
  searchResults: OpponentSearchResult[];
  isSearching: boolean;

  // ── Scheduled ──
  scheduledBattles: Battle[];

  // ── History ──
  battleHistory: BattleHistoryItem[];
  historyCursor: string | null;
  isLoadingHistory: boolean;

  // ── Leaderboard ──
  deptLeaderboard: DeptWarStatsRow[];

  // ── Stats ──
  myStats: UserWarStats | null;

  // ── Incoming challenges awaiting accept/reject (FIFO — oldest shown first) ──
  pendingChallenges: ChallengeSentPayload[];

  // ── Last result (for results screen) ──
  lastResult: {
    winnerId: string | null;
    myScore: number;
    opponentScore: number;
    departmentPoints: number;
    stats: any;
  } | null;

  // ── Finished battle whose result the user already dismissed ──
  // Lets screens skip auto-resuming a battle they've already seen the result
  // for (otherwise "Try Again" → home → auto-push → result modal loops).
  dismissedFinishedBattleId: string | null;

  // ── Actions ──
  setBattlePhase: (phase: BattlePhase) => void;
  setActiveBattle: (battle: Battle | null) => void;
  setQuestions: (questions: BattleQuestion[]) => void;
  setCurrentQuestion: (q: Partial<QuestionState>) => void;
  setMyScore: (score: number) => void;
  setOpponentScore: (score: number) => void;
  setOpponentInfo: (info: any) => void;
  setSearchResults: (results: OpponentSearchResult[]) => void;
  setIsSearching: (v: boolean) => void;
  setScheduledBattles: (battles: Battle[]) => void;
  setBattleHistory: (battles: BattleHistoryItem[], cursor: string | null) => void;
  appendBattleHistory: (battles: BattleHistoryItem[], cursor: string | null) => void;
  setIsLoadingHistory: (v: boolean) => void;
  setDeptLeaderboard: (rows: DeptWarStatsRow[]) => void;
  setMyStats: (stats: UserWarStats) => void;
  setLastResult: (result: any) => void;
  setDismissedFinishedBattle: (battleId: string | null) => void;
  enqueueChallenge: (challenge: ChallengeSentPayload) => void;
  dequeueChallenge: (battleId: string) => void;

  // ── Reset ──
  resetBattle: () => void;
  resetAll: () => void;
}

const initialState = {
  battlePhase: 'idle' as BattlePhase,
  activeBattle: null,
  questions: [],
  currentQuestion: { questionIndex: 0, selectedOption: null, timeRemaining: 15, result: null, correctOption: null },
  myScore: 0,
  opponentScore: 0,
  opponentInfo: null,
  searchResults: [],
  isSearching: false,
  scheduledBattles: [],
  battleHistory: [],
  historyCursor: null,
  isLoadingHistory: false,
  deptLeaderboard: [],
  myStats: null,
  lastResult: null,
  dismissedFinishedBattleId: null,
  pendingChallenges: [],
};

export const useDepartmentWarStore = create<DepartmentWarState>((set) => ({
  ...initialState,

  setBattlePhase: (phase) => set({ battlePhase: phase }),
  setActiveBattle: (battle) => set({ activeBattle: battle }),
  setQuestions: (questions) => set({ questions }),
  setCurrentQuestion: (q) =>
    set((state) => ({
      currentQuestion: { ...state.currentQuestion, ...q },
    })),
  setMyScore: (score) => set({ myScore: score }),
  setOpponentScore: (score) => set({ opponentScore: score }),
  setOpponentInfo: (info) => set({ opponentInfo: info }),
  setSearchResults: (results) => set({ searchResults: results }),
  setIsSearching: (v) => set({ isSearching: v }),
  setScheduledBattles: (battles) => set({ scheduledBattles: battles }),
  setBattleHistory: (battles, cursor) => set({ battleHistory: battles, historyCursor: cursor }),
  appendBattleHistory: (battles, cursor) =>
    set((state) => ({
      battleHistory: [...state.battleHistory, ...battles],
      historyCursor: cursor,
    })),
  setIsLoadingHistory: (v) => set({ isLoadingHistory: v }),
  setDeptLeaderboard: (rows) => set({ deptLeaderboard: rows }),
  setMyStats: (stats) => set({ myStats: stats }),
  setLastResult: (result) => set({ lastResult: result }),
  setDismissedFinishedBattle: (battleId) => set({ dismissedFinishedBattleId: battleId }),
  enqueueChallenge: (challenge) =>
    set((state) =>
      state.pendingChallenges.some((c) => c.battleId === challenge.battleId)
        ? state
        : { pendingChallenges: [...state.pendingChallenges, challenge] },
    ),
  dequeueChallenge: (battleId) =>
    set((state) => ({
      pendingChallenges: state.pendingChallenges.filter((c) => c.battleId !== battleId),
    })),

  resetBattle: () =>
    set({
      battlePhase: 'idle',
      activeBattle: null,
      questions: [],
      currentQuestion: { questionIndex: 0, selectedOption: null, timeRemaining: 15, result: null, correctOption: null },
      myScore: 0,
      opponentScore: 0,
      opponentInfo: null,
    }),

  resetAll: () => set(initialState),
}));
