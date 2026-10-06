import { api } from "./api";

// ─── Types ────────────────────────────────────────────────────────────

export interface PastQuestionFile {
  id: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  url?: string;
}

export interface PastQuestion {
  id: string;
  courseCode?: string;
  course?: string;
  courseTitle?: string;
  title?: string;
  level?: string;
  session?: string;
  year?: string;
  semester?: string;
  examType?: string;
  downloads?: number;
  downloadsCount?: number;
  views?: number;
  department?: string;
  uploader?: { id: string; name?: string; avatar?: string };
  uploaderId?: string;
  files?: PastQuestionFile[];
  createdAt?: string;
  priceCoins?: number;
  /** Whether the current viewer can open this in-app without paying again (owner, free, or already purchased). */
  hasAccess?: boolean;
}

export interface ListPastQuestionsParams {
  page?: number;
  limit?: number;
  search?: string;
  course?: string;
  courseCode?: string;
  level?: string;
  session?: string;
  semester?: string;
  department?: string;
}

export interface CreatePastQuestionPayload {
  level: string;
  course: string;
  courseCode?: string;
  session: string;
  semester?: string;
  files?: { uri: string; name: string; type: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Builds multipart FormData for POST /past-questions.
 * Files are appended under the "files" field to match the backend's
 * FilesInterceptor('files', 10, ...).
 */
function buildCreateFormData(payload: CreatePastQuestionPayload): FormData {
  const formData = new FormData();

  (Object.keys(payload) as (keyof CreatePastQuestionPayload)[]).forEach((key) => {
    if (key === "files") return;

    const value = payload[key];
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  payload.files?.forEach((file) => {
    formData.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
  });

  return formData;
}

// ─── Service ──────────────────────────────────────────────────────────

export const pastQuestionsService = {
  /**
   * POST /past-questions - Upload a new past question with its files
   */
  async create(payload: CreatePastQuestionPayload) {
    const formData = buildCreateFormData(payload);
    const response = await api.post("/past-questions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * GET /past-questions - List past questions (paginated, with optional filters)
   */
  async list(params?: ListPastQuestionsParams) {
    const response = await api.get("/past-questions", { params });
    return response.data;
  },

  /**
   * GET /past-questions/department - List past questions uploaded by users in my department
   */
  async listDepartment(params?: ListPastQuestionsParams) {
    const response = await api.get("/past-questions/department", { params });
    return response.data;
  },

  /**
   * GET /past-questions/:id - Get a single past question
   */
  async findById(id: string) {
    const response = await api.get(`/past-questions/${id}`);
    return response.data;
  },

  /**
   * POST /past-questions/:id/download - Purchase/unlock a past question and get its file metadata
   */
  async purchase(id: string) {
    const response = await api.post(`/past-questions/${id}/download`);
    return response.data;
  },

  /**
   * GET /past-questions/top-contributors - Get top contributors in my department
   */
  async getTopContributors(): Promise<any[]> {
    const response = await api.get("/past-questions/top-contributors");
    return response.data;
  },

  /**
   * GET /past-questions/:id/download - Resolve the redirect and return the actual file URL
   * (the backend responds with a 302 redirect to the file, which also increments downloadsCount)
   */
  async getDownloadUrl(id: string): Promise<{ url: string }> {
    const response = await api.get(`/past-questions/${id}/download`, {
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return { url: (response.headers.location as string) || (response.data as string) };
  },
};
