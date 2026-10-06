import { api } from "./api";

export type NoteCategory = "Classes" | "Personal" | "General";

export interface Note {
  id: string;
  title: string;
  content: string;
  department?: string;
  category: NoteCategory;
  isPinned: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateNotePayload {
  title: string;
  content: string;
  department?: string;
  category?: NoteCategory;
  isPinned?: boolean;
  isBookmarked?: boolean;
}

export interface UpdateNotePayload extends Partial<CreateNotePayload> {}

export const notesService = {
  getNotes: async (search?: string, category?: string): Promise<Note[]> => {
    const response = await api.get("/notes", {
      params: { search, category },
    });
    return response.data;
  },

  getNoteById: async (id: string): Promise<Note> => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  createNote: async (payload: CreateNotePayload): Promise<Note> => {
    const response = await api.post("/notes", payload);
    return response.data;
  },

  updateNote: async (id: string, payload: UpdateNotePayload): Promise<Note> => {
    const response = await api.patch(`/notes/${id}`, payload);
    return response.data;
  },

  togglePin: async (id: string): Promise<Note> => {
    const response = await api.patch(`/notes/${id}/toggle-pin`);
    return response.data;
  },

  toggleBookmark: async (id: string): Promise<Note> => {
    const response = await api.patch(`/notes/${id}/toggle-bookmark`);
    return response.data;
  },

  deleteNote: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },
};