import { UserFollowItem } from "@/screens/(features)/followersFollowingScreen";
import { api } from "./api";

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

export interface UserProfileStats {
  postsCount: number;
  likesCount: number;
  followersCount: number;
  followingCount: number;
  giftsCount: number;
}

export interface FollowStatusResponse {
  isFollowing: boolean;
}

export interface BlockStatusResponse {
  blocked: boolean;
}

export interface IsBlockedResponse {
  isBlocked?: boolean;
  isBlocker?:boolean
}

export interface BlockedUserItem {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  blockedAt?: string;
}

export const userService = {
  /**
   * Checks if authenticated user is following a target user
   * GET /users/:id/is-following
   */
  checkIsFollowing: async (id: string): Promise<FollowStatusResponse> => {
    const response = await api.get(`/users/${id}/is-following`);
    return response.data;
  },

  /**
   * Checks if any block relation exists between authenticated user and target user (either direction)
   * GET /users/:id/is-blocked
   */
  checkIsBlocked: async (id: string): Promise<IsBlockedResponse> => {
    const response = await api.get(`/users/${id}/is-blocked`);
    return response.data;
  },

  /**
   * Checks if authenticated user specifically blocked the target user
   * GET /users/:id/is-blocker
   */
  checkIsBlocker: async (id: string): Promise<IsBlockedResponse> => {
    const response = await api.get(`/users/${id}/is-blocker`);
    return response.data;
  },

  /**
   * Fetches target profile context data
   * GET /users/:id
   */
  getUserProfile: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Fetches target user profile statistics (posts, likes, followers, following, gifts)
   * GET /users/:id/stats
   */
  getUserStats: async (id: string): Promise<UserProfileStats> => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },

  /**
   * Fetches authenticated user's own profile statistics
   * GET /users/me/stats
   */
  getMyStats: async (): Promise<UserProfileStats> => {
    const response = await api.get(`/users/me/stats`);
    return response.data;
  },

  /**
   * Fetch user Level
   * GET /gamification/me
   */
  getUserLevel: async () => {
    const response = await api.get(`/gamification/me`);
    return response.data;
  },

  /**
   * Updates authenticated user profile metrics or configuration changes
   * PATCH /users/me
   */
  updateProfile: async (formData: FormData) => {
    const response = await api.patch("/users/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Follows a target user
   * POST /users/:id/follow
   */
  followUser: async (id: string) => {
    const response = await api.post(`/users/${id}/follow`);
    return response.data;
  },

  /**
   * Unfollows a target user
   * DELETE /users/:id/follow
   */
  unfollowUser: async (id: string) => {
    const response = await api.delete(`/users/${id}/follow`);
    return response.data;
  },

  /**
   * Blocks a target user
   * POST /users/:id/block
   */
  blockUser: async (id: string): Promise<BlockStatusResponse> => {
    const response = await api.post(`/users/${id}/block`);
    return response.data;
  },

  /**
   * Unblocks a target user
   * DELETE /users/:id/block
   */
  unblockUser: async (id: string): Promise<BlockStatusResponse> => {
    const response = await api.delete(`/users/${id}/block`);
    return response.data;
  },

  /**
   * Lists users blocked by the authenticated user
   * GET /users/me/blocked
   */
  getBlockedUsers: async (): Promise<BlockedUserItem[]> => {
    const response = await api.get(`/users/me/blocked`);
    return response.data;
  },

  /**
   * Reports a user account violation to the moderation layer
   * POST /users/:id/report
   */
  reportUser: async (id: string, reason: string) => {
    const response = await api.post(`/users/${id}/report`, { reason });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get(`/posts/users/${id}/profile`);
    return response.data;
  },

  getFollowers: async (
    id: string,
    params?: { search?: string; limit?: number; cursor?: string }
  ): Promise<PaginatedResponse<UserFollowItem>> => {
    const response = await api.get(`/users/${id}/followers`, { params });
    return response.data;
  },

  getFollowing: async (
    id: string,
    params?: { search?: string; limit?: number; cursor?: string }
  ): Promise<PaginatedResponse<UserFollowItem>> => {
    const response = await api.get(`/users/${id}/following`, { params });
    return response.data;
  },

  getUserStatsById: async (id: string) => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },
};