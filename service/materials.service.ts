import { api } from "./api";

// ─── Types ────────────────────────────────────────────────────────────

export type MaterialCategory =
  | "lecture_notes"
  | "textbooks"
  | "assignments"
  | "practicals"
  | "courses";

export interface CampusMaterial {
  id: string;
  title: string;
  description: string | null;
  category: MaterialCategory;
  course: string | null;
  courseCode: string | null;
  level: string | null;
  author: string | null;
  isbn: string | null;
  dueDate: string | null;
  labSession: string | null;
  files: { name: string; uri: string; size?: number }[] | null;
  coverImage: string | null;
  externalLink: string | null;
  priceCoins: number;
  downloadsCount: number;
  createdAt: string;
  uploader?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  } | null;
}

// ─── Service ──────────────────────────────────────────────────────────

export const materialsService = {
  /** GET /materials/:category — list materials filtered by user department */
  async listByCategory(category: MaterialCategory): Promise<CampusMaterial[]> {
    const response = await api.get(`/materials/${category}`);
    return response.data;
  },
};
