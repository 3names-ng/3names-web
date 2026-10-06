import { api } from "./api";

/** Content reported through POST /reports. Posts, comments, users and chat
 * messages have their own report endpoints. */
export type ReportableContentType =
  | "story"
  | "marketplace_item"
  | "hostel_listing"
  | "past_question"
  | "material";

export const reportService = {
  /** POST /reports - Flag content for the moderation team */
  async reportContent(targetType: ReportableContentType, targetId: string, reason: string) {
    const response = await api.post("/reports", { targetType, targetId, reason });
    return response.data;
  },
};
