import { api } from "./api";

export interface LeaderboardParams {
  scope?: "department" | "faculty" | "school" | "app";
  departmentId?: string;
  facultyId?: string;
  schoolId?: string;
  limit?: number;
}

export const leaderboardService = {
  getByLeaderboard: async (params: LeaderboardParams = {}) => {
    const cleanedParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
    );
    const response = await api.get("/gamification/leaderboard/givers", {
      params: cleanedParams,
    });
    return response.data;
  },


    getLevels: async () => {
   
    const response = await api.get("/gamification/levels");
    return response.data;
  },
};