// services/index.ts
import { api } from "./api";
import { appendUploadFile } from "@/utils/uploadFile";

// ==========================================
// 📋 PAYLOAD & DATA INTERFACES
// ==========================================

export interface CreatePostPayload {
  description?: string;
  category?: string;
  feeling?: string;
  location?: string;
  visibility?: string; 
  commentPermission?: string; 
  giftsEnabled?: boolean;
  status?: string; 
  taggedUserIds?: string[];
  hashtags?: string[];
  // Text-style posts (painted like story text)
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontStyle?: 'classic' | 'serif' | 'typewriter' | 'light' | 'strong';
  fontSize?: 'small' | 'medium' | 'large';
  /**
   * JSON-stringified TextPostSlide[] — a swipeable carousel of text cards on
   * one post, same idea as multiple media files on a media post. The fields
   * above always mirror slide[0] so a backend that doesn't parse this yet
   * still has something to render.
   */
  textSlides?: string;
  /**
   * JSON array, one entry per media file in upload order: the camera filter
   * the server applies to that VIDEO ("" = none). Photos arrive pre-filtered.
   */
  mediaFilters?: string;
  // Sound played alongside the post (see service/sound.service.ts)
  soundId?: string;
  soundStartMs?: number;
  soundVolume?: number;
  originalVolume?: number;
}

export interface CursorPaginationPayload {
  limit?: number;
  cursor?: string;
}

export interface FeedQueryPayload {
  tab?: 'for-you' | 'following' | 'campus' | string;
  limit?: number;
  cursor?: string;
}

export interface CoinPurchasePayload {
  coins: number;
}

export interface ResharePostPayload {
  comment?: string;
}

// ==========================================
// 🕹️ POST SERVICE
// ==========================================

export const postService = {
  /**
   * Sends multipart/form-data to the NestJS backend matching:
   * @Body() dto: CreatePostDto and @UploadedFiles() files: Express.Multer.File[]
   */
  createPost: async (
    payload: CreatePostPayload, 
    mediaFiles: Array<{ uri: string; type: string; name: string }>
  ) => {
    const formData = new FormData();

    if (payload.description) formData.append('description', payload.description);
    if (payload.category) formData.append('category', payload.category);
    if (payload.feeling) formData.append('feeling', payload.feeling);
    if (payload.location) formData.append('location', payload.location);
    if (payload.visibility) formData.append('visibility', payload.visibility);
    if (payload.commentPermission) formData.append('commentPermission', payload.commentPermission);
    if (payload.status) formData.append('status', payload.status);
    
    if (payload.giftsEnabled !== undefined) {
      formData.append('giftsEnabled', String(payload.giftsEnabled));
    }

    if (payload.backgroundColor) formData.append('backgroundColor', payload.backgroundColor);
    if (payload.textAlign) formData.append('textAlign', payload.textAlign);
    if (payload.fontStyle) formData.append('fontStyle', payload.fontStyle);
    if (payload.fontSize) formData.append('fontSize', payload.fontSize);
    if (payload.textSlides) formData.append('textSlides', payload.textSlides);
    if (payload.mediaFilters) formData.append('mediaFilters', payload.mediaFilters);

    if (payload.soundId) {
      formData.append('soundId', payload.soundId);
      formData.append('soundStartMs', String(Math.round(payload.soundStartMs ?? 0)));
      formData.append('soundVolume', String(payload.soundVolume ?? 1));
      formData.append('originalVolume', String(payload.originalVolume ?? 0.3));
    }

    if (payload.taggedUserIds && payload.taggedUserIds.length > 0) {
      payload.taggedUserIds.forEach((id) => formData.append('taggedUserIds[]', id));
    }

    if (payload.hashtags && payload.hashtags.length > 0) {
      payload.hashtags.forEach((tag) => formData.append('hashtags[]', tag));
    }

    // Works on phones and web (browsers need the file data, not just a uri)
    for (const file of mediaFiles) {
      await appendUploadFile(formData, 'media', file);
    }

    const response = await api.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data, 
    });
    
    return response.data;
  },

  /**
   * Fetches the main personalized feeds (for-you, following, campus)
   * GET /posts/feed?tab=for-you&limit=10
   */
  getFeed: async (query?: FeedQueryPayload) => {
    const response = await api.get('/posts/feed', { params: query });
    return response.data;
  },

  /**
   * Fetches published posts created by the currently logged-in user
   * GET /posts/me
   */
  getMyPosts: async (pagination?: CursorPaginationPayload) => {
    const response = await api.get('/posts/me', { params: pagination });
    return response.data;
  },

  /**
   * Fetches paginated public posts created by a specific user
   * GET /posts/users/:userId/posts
   */
  getUserPosts: async (userId: string, pagination?: CursorPaginationPayload) => {
    const response = await api.get(`/posts/users/${userId}/posts`, {
      params: pagination,
    });
    return response.data;
  },

  /**
   * Fetches soft-hidden posts for the currently logged-in user
   * GET /posts/hidden
   */
  getHiddenPosts: async (pagination?: CursorPaginationPayload) => {
    const response = await api.get('/posts/hidden', { params: pagination });
    return response.data;
  },

  /**
   * Fetches posts where the currently logged-in user is tagged
   * GET /posts/tagged
   */
  getTaggedPosts: async (pagination?: CursorPaginationPayload) => {
    const response = await api.get('/posts/tagged', { params: pagination });
    return response.data;
  },

  /**
   * Fetches favorited posts for the currently logged-in user
   * GET /posts/favorites
   */
  getFavorites: async (pagination?: CursorPaginationPayload) => {
    const response = await api.get('/posts/favorites', { params: pagination });
    return response.data;
  },

  /**
   * Fetches reshares made by the currently logged-in user
   * GET /posts/reshares
   */
  getReshares: async (pagination?: CursorPaginationPayload) => {
    const response = await api.get('/posts/reshares', { params: pagination });
    return response.data;
  },

  /**
   * Fetches a single post by ID
   * GET /posts/:id
   */
  getPostById: async (id: string) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  /**
   * Fetches personal drafts for the currently logged-in user
   * GET /posts/drafts
   */
  getDrafts: async () => {
    const response = await api.get('/posts/drafts');
    return response.data;
  },

  /**
   * Updates an existing post
   * PATCH /posts/:id
   */
  updatePost: async (id: string, dto: Partial<CreatePostPayload>) => {
    const response = await api.patch(`/posts/${id}`, dto);
    return response.data;
  },

  /**
   * Publishes a draft post
   * PATCH /posts/:id/publish
   */
  publishDraft: async (id: string) => {
    const response = await api.patch(`/posts/${id}/publish`);
    return response.data;
  },

  /**
   * Soft-hides a post from the current user's feed experience
   * PATCH /posts/:id/hide
   */
  hidePost: async (id: string) => {
    const response = await api.patch(`/posts/${id}/hide`);
    return response.data;
  },

  /**
   * Restores a previously hidden post back to the feed
   * PATCH /posts/:id/unhide
   */
  unhidePost: async (id: string) => {
    const response = await api.patch(`/posts/${id}/unhide`);
    return response.data;
  },

  /**
   * Fetches the paginated comment section for a post
   * GET /posts/:id/comments
   */
  getPostComments: async (id: string, pagination?: CursorPaginationPayload) => {
    const response = await api.get(`/posts/${id}/comments`, { params: pagination });
    return response.data;
  },

  /**
   * Adds a new comment text to a post
   * POST /posts/:id/comments
   */
  addComment: async (id: string, text: string) => {
    const response = await api.post(`/posts/${id}/comments`, { text });
    return response.data;
  },

  /**
   * Adds a new reply text to a specific comment
   * POST /comments/:id/reply
   */
  replyToComment: async (id: string, text: string) => {
    const response = await api.post(`/comments/${id}/reply`, { text });
    return response.data;
  },

  /**
   * Fetches reply comments for a target comment
   * GET /comments/comments/:id/replies
   */
  getReplies: async (id: string) => {
    const response = await api.get(`/comments/comments/${id}/replies`);
    return response.data;
  },

  /**
   * Fetches a single comment (used to resolve which parent to expand when
   * deep-linking to a reply that isn't a top-level comment)
   * GET /comments/:id
   */
  getCommentById: async (id: string) => {
    const response = await api.get(`/comments/${id}`);
    return response.data;
  },

  /**
   * Deletes an owned post by ID
   * DELETE /posts/:id
   */
  deletePost: async (id: string) => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },


    /**
   * Deletes an owned post by ID
   * DELETE /comment/:id
   */
  deleteComment: async (id: string) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },

    /**
   * Reports a comments violation to the moderation layer
   * POST /comments/:id/report
   */
  reportComment: async (id: string, reason: string) => {
    const response = await api.post(`/comments/${id}/report`, { reason });
    return response.data;
  },

  /**
   * Reports a post violation to the moderation layer
   * POST /posts/:id/report
   */
  reportPosts: async (id: string, reason: string) => {
    const response = await api.post(`/posts/${id}/report`, { reason });
    return response.data;
  },

  /**
   * Lists users who have gifted my post (owner only), paginated
   * GET /posts/:id/gifters
   */
  getPostGifters: async (id: string, cursor?: string | null, limit = 20) => {
    const response = await api.get(`/posts/${id}/gifters`, { params: { cursor: cursor ?? undefined, limit } });
    return response.data;
  },

  /**
   * Records an impression view for a post (no-ops server-side for the owner)
   * POST /posts/:id/view
   */
  recordPostView: async (id: string) => {
    const response = await api.post(`/posts/${id}/view`);
    return response.data;
  },

  /**
   * Lists users who have viewed my post (owner only), paginated
   * GET /posts/:id/viewers
   */
  getPostViewers: async (id: string, cursor?: string | null, limit = 20) => {
    const response = await api.get(`/posts/${id}/viewers`, { params: { cursor: cursor ?? undefined, limit } });
    return response.data;
  },

  /**
   * Lists users who have liked a post, paginated
   * GET /posts/:id/likers
   */
  getPostLikers: async (id: string, cursor?: string | null, limit = 20) => {
    const response = await api.get(`/posts/${id}/likers`, { params: { cursor: cursor ?? undefined, limit } });
    return response.data;
  },

  /**
   * Likes a post
   * POST /posts/:id/like
   */
  likePost: async (id: string) => {
    const response = await api.post(`/posts/${id}/like`);
    return response.data;
  },

  /**
   * Removes a like from a post
   * DELETE /posts/:id/like
   */
  unlikePost: async (id: string) => {
    const response = await api.delete(`/posts/${id}/like`);
    return response.data;
  },

  /**
   * Likes a comment
   * POST /comments/:id/like
   */
  likeComment: async (id: string) => {
    const response = await api.post(`/comments/${id}/like`);
    return response.data;
  },

  /**
   * Removes a like from a comment
   * DELETE /comments/:id/like
   */
  unlikeComments: async (id: string) => {
    const response = await api.delete(`/comments/${id}/like`);
    return response.data;
  },

  /**
   * Adds a post to user's favorites/bookmarks
   * POST /posts/:id/favorite
   */
  addFavorite: async (id: string) => {
    const response = await api.post(`/posts/${id}/favorite`);
    return response.data;
  },

  /**
   * Removes a post from user's favorites/bookmarks
   * DELETE /posts/:id/favorite
   */
  removeFavorite: async (id: string) => {
    const response = await api.delete(`/posts/${id}/favorite`);
    return response.data;
  },

  /**
   * Reshares/reposts a post to the user's feed
   * POST /posts/:id/reshare
   */
  resharePost: async (id: string, payload?: ResharePostPayload) => {
    const response = await api.post(`/posts/${id}/reshare`, payload);
    return response.data;
  }
};

// ==========================================
// 🪙 COIN SERVICE
// ==========================================

export const coinService = {
  /**
   * Fetches the current user's Campus Coins balance metrics
   * GET /coins/balance
   */
  /** Ask the backend to credit any store purchases RevenueCat has but we haven't credited yet. */
  syncStorePurchases: async () => {
    const response = await api.post('/coins/iap/sync');
    return response.data as { credited: number; balance: { balance: number } };
  },

  getBalance: async () => {
    const response = await api.get('/coins/balance');
    return response.data; // Expected payload: { balance: number }
  },

  /**
   * Fetches paginated coin transactional line items
   * GET /coins/transactions
   */
  listTransactions: async (pagination?: CursorPaginationPayload) => {
    const response = await api.get('/coins/transactions', { params: pagination });
    return response.data;
  },

  /**
   * Starts a Paystack coin purchase and returns its checkout URL.
   * Web and native dev builds only: iOS / Android release builds sell coins
   * through store in-app purchase (see components/gift/topUpModal.tsx).
   * POST /coins/purchase
   */
  purchaseCoins: async (payload: CoinPurchasePayload) => {
    const response = await api.post('/coins/purchase', payload);
    return response.data; // Expected payload: { authorizationUrl: string, reference: string }
  },
};

// ==========================================
// 🎁 GIFT SERVICE
// ==========================================

export enum GiftTargetType {
  POST = 'post',
  STORY = 'story',
  GROUP = 'group',
  DM = 'dm',
}

export interface SendGiftDto {
  giftId: string;
  targetType: GiftTargetType;
  targetId: string;
  recipientId?: string;
  comboCount?: number;
}

export interface GiftTransaction {
  id: string;
  giftId: string;
  senderId: string;
  recipientId: string;
  targetType: GiftTargetType;
  targetId: string;
  coinsCost: number;
  createdAt: string;
}

export const giftService = {
  /**
   * Fetches all available gifts catalog
   * GET /gifts
   */
  getAllGift: async () => {
    const response = await api.get('/gifts');
    return response.data;
  },

  /**
   * Sends a gift to a specific post or story target
   */
  sendGift: async (dto: SendGiftDto): Promise<GiftTransaction> => {
    try {
      const response = await api.post<GiftTransaction>('/gifts/send', dto);
      return response.data;
    } catch (error) {
      console.error('Error dispatching gift:', error);
      throw error;
    }
  },
};