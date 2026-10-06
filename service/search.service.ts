import { api } from "./api";
import { GenericAbortSignal } from "axios";

export interface SearchUserItem {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  profileFrame?: string | null;
  appLevel?: any | null;
  bio: string | null;
  isFollowing?: boolean;
  school: { id: string; name: string } | null;
  faculty: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
}

export interface SearchUsersResponse {
  items: SearchUserItem[];
}

export const searchService = {
  /**
   * Search users by name or username with request cancellation support
   */
  searchUsers: async (
    query: string,
    limit = 10,
    signal?: GenericAbortSignal
  ): Promise<SearchUsersResponse> => {
    const response = await api.get<SearchUsersResponse>("/users/search", {
      params: { q: query, limit },
      signal,
    });
    return response.data;
  },

  /**
   * Fetch trending users
   */
  getTrendingUsers: async (limit = 10): Promise<SearchUsersResponse> => {
    const response = await api.get<SearchUsersResponse>("/users/trending", {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Fetch suggested users
   */
  getSuggestedUsers: async (limit = 10): Promise<SearchUsersResponse> => {
    const response = await api.get<SearchUsersResponse>("/users/suggested", {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Save a selected user to recent search history (local store)
   */
  addRecentSearch: async (_searchedUserId: string): Promise<void> => {
    // Now handled by useRecentSearchStore — no-op here for backwards compatibility
    return;
  },

  /**
   * Remove a single recent search entry (local store)
   */
  removeRecentSearch: async (_searchedUserId: string): Promise<void> => {
    // Now handled by useRecentSearchStore — no-op here for backwards compatibility
    return;
  },

  /**
   * Clear all recent searches (local store)
   */
  clearAllRecentSearches: async (): Promise<void> => {
    // Now handled by useRecentSearchStore — no-op here for backwards compatibility
    return;
  },
};