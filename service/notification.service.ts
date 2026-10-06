import { api } from "./api";
import { Platform } from "react-native";

export const notificationService = {
  getAllNotification: async (cursor?: string | null, limit = 20) => {
    const response = await api.get("/notifications", { params: { cursor: cursor ?? undefined, limit } });
    return response.data;
  },

  /**
   * Get the count of unread notifications.
   */
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  /**
   * Register the Expo push token with the backend so it can be used
   * to send push notifications to this device.
   */
  registerPushToken: async (
    pushToken: string,
    platform: string = Platform.OS,
  ) => {
    const response = await api.post("/notifications/push-token", {
      pushToken,
      platform,
    });
    return response.data;
  },

  /**
   * Remove the push token from the backend (e.g. on logout).
   */
  unregisterPushToken: async (pushToken: string) => {
    const response = await api.post("/notifications/push-token/unregister", {
      pushToken,
    });
    return response.data;
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read.
   */
  markAllAsRead: async () => {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  },
};