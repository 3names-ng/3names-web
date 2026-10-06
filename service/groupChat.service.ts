import { api } from "./api";

export interface CursorPaginatedResponse<T> {
  id?:string,
  items: T[];
  
  nextCursor: string | null;
}
export interface Group {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  type?: string;
  membersCount?: number;
  isLocked?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
  isOfficial?: boolean;
  createdAt?: string;
  isSystemManaged?: boolean;
  isAdmin?: boolean;
  unreadCount?: number;
  lastMessageAt?: any;
  lastReadAt?: string;
  createdById?:string
  participant?:any
}

export interface GroupMember {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'MEMBER';
  isAdmin?: boolean;
  user?: any;
}

export interface ImageFile {
  uri: string;
  name: string;
  type: string;
  durationMillis?: number;
}

export interface SendMessagePayload {
  content?: string;
  replyToId?: string;
  durationMillis?: number;
  attachments?: any[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: string;
  attachments?: string[];
}

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface MarkAsReadResponse {
  success: boolean;
  lastReadAt: string;
}

// REST API Methods matching GroupsController
export const GroupsApi = {
  // GET /groups
  listMine: async (): Promise<Group[]> => {
    const { data } = await api.get('/groups');
    return data;
  },


   // GET /groups/default
  getDefaultGroups: async (): Promise<Group[]> => {
    const { data } = await api.get('/groups/default');
    return data;
  },

  // GET /groups/:id
  getDetail: async (id: string): Promise<Group> => {
    const { data } = await api.get(`/groups/${id}`);
    return data;
  },

  // POST /groups (multipart/form-data)
  createGroup: async (name: string, description?: string, icon?: ImageFile): Promise<Group> => {
    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    if (icon) {
      formData.append('icon', {
        uri: icon.uri,
        name: icon.name || 'icon.jpg',
        type: icon.type || 'image/jpeg',
      } as any);
    }

    const { data } = await api.post('/groups', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // PATCH /groups/:id (multipart/form-data)
  updateGroup: async (id: string, name?: string, description?: string, icon?: ImageFile): Promise<Group> => {
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    if (icon) {
      formData.append('icon', {
        uri: icon.uri,
        name: icon.name || 'icon.jpg',
        type: icon.type || 'image/jpeg',
      } as any);
    }

    const { data } = await api.patch(`/groups/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  // PATCH /groups/:id/lock
  lockGroup: async (id: string, isLocked: boolean): Promise<Group> => {
    const { data } = await api.patch(`/groups/${id}/lock`, { isLocked });
    return data;
  },

  // PATCH /groups/:id/mute
  muteGroup: async (id: string, isMuted: boolean): Promise<Group> => {
    const { data } = await api.patch(`/groups/${id}/mute`, { isMuted });
    return data;
  },

  // POST /groups/:id/read
  markAsRead: async (id: string): Promise<MarkAsReadResponse> => {
    const { data } = await api.post(`/groups/${id}/read`);
    return data;
  },

  // GET /groups/:id/members
  listMembers: async (id: string): Promise<GroupMember[]> => {
    const { data } = await api.get(`/groups/${id}/members`);
    return data;
  },


  // POST /groups/:id/members
  addMember: async (id: string, targetUserId: string): Promise<GroupMember> => {
    const { data } = await api.post(`/groups/${id}/members`, { userId: targetUserId });
    return data;
  },

  // DELETE /groups/:id/members/:userId
  removeMember: async (id: string, targetUserId: string): Promise<void> => {
    await api.delete(`/groups/${id}/members/${targetUserId}`);
  },

  // PATCH /groups/:id/members/:targetUserId/promote
  promoteMember: async (id: string, targetUserId: string): Promise<GroupMember> => {
    const { data } = await api.patch(`/groups/${id}/members/${targetUserId}/promote`);
    return data;
  },

  // PATCH /groups/:id/members/:targetUserId/demote
  demoteMember: async (id: string, targetUserId: string): Promise<GroupMember> => {
    const { data } = await api.patch(`/groups/${id}/members/${targetUserId}/demote`);
    return data;
  },

  // POST /groups/:id/leave
  leaveGroup: async (id: string): Promise<void> => {
    await api.post(`/groups/${id}/leave`);
  },

  /**
   * Send a message to a group (supports text and multipart file attachments)
   */
  sendMessage: async (
    groupId: string,
    payload: SendMessagePayload,
    files: any[] = []
  ): Promise<ChatMessage> => {
    if (files.length > 0) {
      const formData = new FormData();
      if (payload.content) {
        formData.append('content', payload.content);
      }
      if (payload.replyToId) {
        formData.append('replyToId', payload.replyToId);
      }

      files.forEach((file) => {
        formData.append('attachments', file);
      });

      // Voice notes carry their recorded duration so the list can show it
      if (typeof payload.durationMillis === 'number') {
        formData.append('durationMillis', String(payload.durationMillis));
      }

      const response = await api.post(`/groups/${groupId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }

    const response = await api.post(`/groups/${groupId}/messages`, payload);
    return response.data;
  },

  /**
   * Fetch paginated history for a group
   */
  getMessages: async (
    groupId: string,
    params?: CursorPaginationParams
  ): Promise<ChatMessage[]> => {
    const response = await api.get(`/groups/${groupId}/messages`, { params });
    return response.data;
  },

  /**
   * Edit an existing message
   */
  editMessage: async (
    groupId: string,
    messageId: string,
    content: string
  ): Promise<ChatMessage> => {
    const response = await api.patch(`/groups/${groupId}/messages/${messageId}`, {
      content,
    });
    return response.data;
  },

  /**
   * Delete a message
   */
  deleteMessage: async (groupId: string, messageId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}/messages/${messageId}`);
  },

  /**
   * React to a message with an emoji
   */
  addReaction: async (
    groupId: string,
    messageId: string,
    emoji: string
  ): Promise<any> => {
    const response = await api.post(
      `/groups/${groupId}/messages/${messageId}/reactions`,
      { emoji }
    );
    return response.data;
  },

  /**
   * Remove reaction from a message
   */
  removeReaction: async (
    groupId: string,
    messageId: string
  ): Promise<void> => {
    await api.delete(`/groups/${groupId}/messages/${messageId}/reactions`);
  },

  /**
   * Pin a message in a group chat (admin only)
   */
  pinMessage: async (groupId: string, messageId: string): Promise<any> => {
    const { data } = await api.patch(`/groups/${groupId}/messages/${messageId}/pin`);
    return data;
  },

  /**
   * Unpin a message in a group chat (admin only)
   */
  unpinMessage: async (groupId: string, messageId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}/messages/${messageId}/pin`);
  },

  /**
   * Report a message (group chat or 1:1 conversation)
   */
  reportMessage: async (groupId: string, messageId: string, reason: string): Promise<void> => {
    await api.post(`/groups/${groupId}/messages/${messageId}/report`, { reason });
  },

  /**
   * Get the currently pinned message for a group
   */
  getPinnedMessage: async (groupId: string): Promise<any> => {
    const { data } = await api.get(`/groups/${groupId}/messages/pinned`);
    return data;
  },


  // Pin / Unpin a group chat
  pinGroup: async (id: string): Promise<Group> => {
    const { data } = await api.patch(`/groups/${id}/pin`, { isPinned: true });
    return data;
  },

  unpinGroup: async (id: string): Promise<Group> => {
    const { data } = await api.patch(`/groups/${id}/pin`, { isPinned: false });
    return data;
  },

  // one-one messaging


   // Fetch list of user's DMs
  listDirectConversations: async (): Promise<any[]> => {
    const { data } = await api.get("/dm");
    return data;
  },

createDirectConversation: async (targetUserId: string): Promise<Group> => {
  const response = await api.post(`/dm/${targetUserId}`);
  return response.data;
}, 

joinGroup: async (id: string): Promise<Group> => {
  const response = await api.post(`/groups/${id}/join`);
  return response.data;
},

  // Pin / Unpin a DM conversation
  pinDm: async (id: string): Promise<any> => {
    const { data } = await api.patch(`/dm/${id}/pin`, { isPinned: true });
    return data;
  },

  unpinDm: async (id: string): Promise<any> => {
    const { data } = await api.patch(`/dm/${id}/pin`, { isPinned: false });
    return data;
  },

  // Fetch paginated messages for a conversation
  getMelistMessages: async (
    groupId: string,
    params?: { cursor?: string; limit?: number }
  ): Promise<CursorPaginatedResponse<any>> => {
    const response = await api.get(`/dm/${groupId}/messages`, { params });
    return response.data;
  },

  // Mark all unread messages in a conversation as read
  markAsReadDm: async (groupId: string): Promise<void> => {
    await api.post(`/dm/${groupId}/read`);
  },
};