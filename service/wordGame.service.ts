import { api } from "./api";

export type LetterStatus = "correct" | "present" | "absent";

export interface TodayPuzzle {
  puzzleNumber: number;
  guesses: string[];
  feedback: LetterStatus[][];
  completed: boolean;
  won: boolean;
  maxGuesses: number;
  answer?: string;
}

export interface WordGameStats {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalPlayed: number;
  totalWon: number;
  guessDistribution: number[];
  lastPuzzleNumber: number | null;
}

export interface SubmitGuessResult extends TodayPuzzle {
  xpAwarded: number;
  stats: WordGameStats;
}

export const wordGameService = {
  /** GET /word-game/today - Today's puzzle progress */
  async getToday(): Promise<TodayPuzzle> {
    const response = await api.get("/word-game/today");
    return response.data;
  },

  /** POST /word-game/guess - Submit a guess for today's word */
  async submitGuess(guess: string): Promise<SubmitGuessResult> {
    const response = await api.post("/word-game/guess", { guess });
    return response.data;
  },

  /** GET /word-game/stats - My streak and stats */
  async getStats(): Promise<WordGameStats> {
    const response = await api.get("/word-game/stats");
    return response.data;
  },
};
