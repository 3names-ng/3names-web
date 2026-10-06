import { api } from "./api";

export const storyService = {
  // Get all stories
  getStories: async () => {
    const response = await api.get("/stories/feed");
    return response.data;
  },

  // Get a single story
  getStory: async (id: string) => {
    const response = await api.get(`/stories/${id}`);
    return response.data;
  },

  // Create a story
createStory: async (formData: FormData) => {
    const response = await api.post("/stories", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
  
  // Update a story
  updateStory: async (id: string, data: any) => {
    const response = await api.patch(`/stories/${id}`, data);
    return response.data;
  },

  // Delete a story
  deleteStory: async (id: string) => {
    const response = await api.delete(`/stories/${id}`);
    return response.data;
  },

  // React to a story with an emoji
  reactToStory: async (id: string, emoji: string) => {
    const response = await api.post(`/stories/${id}/react`, { emoji });
    return response.data; // Returns { reacted: true }
  },

  // Remove reaction from a story
  unreactFromStory: async (id: string) => {
    const response = await api.delete(`/stories/${id}/react`);
    return response.data; // Returns { reacted: false }
  },

  // List users who have viewed my story (owner only), paginated
  getStoryViewers: async (id: string, cursor?: string | null, limit = 20) => {
    const response = await api.get(`/stories/${id}/viewers`, { params: { cursor: cursor ?? undefined, limit } });
    return response.data;
  },

  // List users who have reacted to my story (owner only), paginated
  getStoryReactions: async (id: string, cursor?: string | null, limit = 20) => {
    const response = await api.get(`/stories/${id}/reactions`, { params: { cursor: cursor ?? undefined, limit } });
    return response.data;
  },

  // List users who have gifted my story (owner only), paginated
  getStoryGifters: async (id: string, cursor?: string | null, limit = 20) => {
    const response = await api.get(`/stories/${id}/gifters`, { params: { cursor: cursor ?? undefined, limit } });
    return response.data;
  },
};