import { api } from "./api";

// ─── Types ────────────────────────────────────────────────────────────

export interface ProjectTopic {
  id: string;
  title: string;
  description?: string;
  department?: string;
  departmentId?: string;
  course?: string;
  courseCode?: string;
  level?: string;
  category?: string;
  tags?: string[];
  status?: string;
  upvotes?: number;
  downvotes?: number;
  views?: number;
  userVote?: 'up' | 'down' | null;
  author?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profilePictureUrl?: string;
    name?: string;
    avatar?: string | null;
  };
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListProjectTopicsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  level?: string;
  course?: string;
}

export interface CreateProjectTopicPayload {
  title: string;
  description?: string;
  course?: string;
  courseCode?: string;
  level?: string;
  category?: string;
  tags?: string[];
}

// ─── Service ──────────────────────────────────────────────────────────

export const projectTopicsService = {
  /**
   * POST /project-topics - Create a new project topic
   */
  async create(payload: CreateProjectTopicPayload): Promise<ProjectTopic> {
    const response = await api.post("/project-topics", payload);
    return response.data;
  },

  /**
   * GET /project-topics - List all project topics (paginated, with optional filters)
   */
  async list(params?: ListProjectTopicsParams): Promise<PaginatedResponse<ProjectTopic>> {
    const response = await api.get("/project-topics", { params });
    return response.data;
  },

  /**
   * GET /project-topics/department - List project topics in the current user's department
   */
  async listDepartment(params?: ListProjectTopicsParams): Promise<PaginatedResponse<ProjectTopic>> {
    const response = await api.get("/project-topics/department", { params });
    return response.data;
  },

  /**
   * GET /project-topics/:id - Get a single project topic
   */
  async findById(id: string): Promise<ProjectTopic> {
    const response = await api.get(`/project-topics/${id}`);
    return response.data;
  },

  /**
   * PATCH /project-topics/:id - Update a project topic (author only)
   */
  async update(id: string, payload: Partial<CreateProjectTopicPayload>): Promise<ProjectTopic> {
    const response = await api.patch(`/project-topics/${id}`, payload);
    return response.data;
  },

  /**
   * DELETE /project-topics/:id - Delete a project topic (author only)
   */
  async remove(id: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/project-topics/${id}`);
    return response.data;
  },

  /**
   * POST /project-topics/:id/upvote - Upvote a project topic
   */
  async upvote(id: string): Promise<{ upvotes: number; downvotes: number; userVote: 'up' | 'down' | null }> {
    const response = await api.post(`/project-topics/${id}/upvote`);
    return response.data;
  },

  /**
   * POST /project-topics/:id/downvote - Downvote a project topic
   */
  async downvote(id: string): Promise<{ upvotes: number; downvotes: number; userVote: 'up' | 'down' | null }> {
    const response = await api.post(`/project-topics/${id}/downvote`);
    return response.data;
  },
};
