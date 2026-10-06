import { create } from 'zustand';

export interface CoinBattleQuestion {
  id: string;
  questionText: string;
  options: string[];
}

interface CoinBattleState {
  // Queue state
  isQueued: boolean;
  queuedStake: number | null;
  battleId: string | null;

  // Match state
  matchFound: boolean;
  matchData: {
    stake: number;
    pot: number;
    winnerPrize: number;
    platformFee: number;
    player1Id: string | null;
    opponent: {
      id: string;
      username: string | null;
      firstName: string | null;
      profilePictureUrl: string | null;
    } | null;
  } | null;

  // Battle state
  questions: CoinBattleQuestion[];
  currentQuestion: {
    questionIndex: number;
    selectedOption: number | null;
    result: 'correct' | 'wrong' | 'failed' | null;
    correctOption: number | null;
  };
  myScore: number;
  opponentScore: number;
  opponentInfo: {
    id: string;
    username: string | null;
    firstName: string | null;
    profilePictureUrl: string | null;
  } | null;

  // Result state
  lastResult: {
    winnerId: string | null;
    myScore: number;
    opponentScore: number;
    stake: number;
    pot: number;
    winnerPrize: number;
    platformFee: number;
    isDraw: boolean;
    /** Who forfeited by not reconnecting in time, when that's how it ended */
    forfeitedBy?: string | null;
  } | null;

  // Actions
  setQueued: (isQueued: boolean, stake?: number | null, battleId?: string | null) => void;
  setBattleId: (battleId: string | null) => void;
  setMatchFound: (data: CoinBattleState['matchData']) => void;
  setQuestions: (questions: CoinBattleQuestion[]) => void;
  setCurrentQuestion: (update: Partial<CoinBattleState['currentQuestion']>) => void;
  setMyScore: (score: number) => void;
  setOpponentScore: (score: number) => void;
  setOpponentInfo: (info: CoinBattleState['opponentInfo']) => void;
  setLastResult: (result: CoinBattleState['lastResult']) => void;
  resetBattle: () => void;
}

const initialState = {
  isQueued: false,
  queuedStake: null,
  battleId: null,
  matchFound: false,
  matchData: null,
  questions: [],
  currentQuestion: {
    questionIndex: 0,
    selectedOption: null,
    result: null,
    correctOption: null,
  },
  myScore: 0,
  opponentScore: 0,
  opponentInfo: null,
  lastResult: null,
};

export const useCoinBattleStore = create<CoinBattleState>((set) => ({
  ...initialState,

  setQueued: (isQueued, stake = null, battleId = null) =>
    set({ isQueued, queuedStake: stake, battleId }),

  setBattleId: (battleId) => set({ battleId }),

  setMatchFound: (data) =>
    set({ matchFound: true, matchData: data }),

  setQuestions: (questions) =>
    set({ questions }),

  setCurrentQuestion: (update) =>
    set((state) => ({
      currentQuestion: { ...state.currentQuestion, ...update },
    })),

  setMyScore: (score) => set({ myScore: score }),

  setOpponentScore: (score) => set({ opponentScore: score }),

  setOpponentInfo: (info) => set({ opponentInfo: info }),

  setLastResult: (result) => set({ lastResult: result }),

  resetBattle: () => set(initialState),
}));
