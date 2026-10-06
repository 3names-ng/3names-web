import { api } from "./api";

export const supportService = {
  // Report a problem to the support team
  reportProblem: async (payload: {
    category: string;
    subject?: string;
    message: string;
  }) => {
    const response = await api.post("/support/report-problem", payload);
    return response.data;
  },
};
