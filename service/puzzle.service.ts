import { api } from "./api";
import type { AppLevel } from "@/store";

export interface PuzzleStats {
  userId: string;
  bestScore: number;
  highestTile: number;
  gamesPlayed: number;
  milestonesAwarded: number[];
}

export interface PuzzleScoreResult {
  bestScore: number;
  highestTile: number;
  isNewBest: boolean;
  newMilestones: number[];
  xpAwarded: number;
  coinsAwarded: number;
}

export interface PuzzleLeaderboardEntry {
  userId: string;
  username: string | null;
  profilePictureUrl: string | null;
  profileFrame: string | null;
  bestScore: number;
  highestTile: number;
  level: AppLevel | null;
}

export const puzzleService = {
  /** POST /puzzle/score - Submit a completed 2048 game score */
  async submitScore(score: number, highestTile: number): Promise<PuzzleScoreResult> {
    const response = await api.post("/puzzle/score", { score, highestTile });
    return response.data;
  },

  /** GET /puzzle/me - Get my personal-best puzzle stats */
  async getMyStats(): Promise<PuzzleStats> {
    const response = await api.get("/puzzle/me");
    return response.data;
  },

  /** GET /puzzle/leaderboard - Top 2048 high scores */
  async getLeaderboard(limit = 20): Promise<PuzzleLeaderboardEntry[]> {
    const response = await api.get("/puzzle/leaderboard", { params: { limit } });
    return response.data;
  },
};
