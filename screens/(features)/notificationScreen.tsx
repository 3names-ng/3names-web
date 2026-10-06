import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ScrollView, RefreshControl, ActivityIndicator, View, TouchableOpacity } from "react-native";
import { isToday, isYesterday, isThisWeek } from "date-fns";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";

import NotificationHeader from "@/components/notification/notificationHeader";
import NotificationTabs, {
  NotificationFilter,
} from "@/components/notification/notificationTab";
import NotificationSection from "@/components/notification/notificationSection";
import EmptyNotification from "@/components/notification/emptyNotification";

import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { notificationService } from "@/service/notification.service";
import NotificationListSkeleton from "@/components/notification/notificationSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { useNotificationStore } from "@/store/notificationStore";
import { ThemedView } from "@/components/ui/ThemedView";
import { navigateFromNotification } from "@/utils/notifications/deepLink";
import { GroupsApi } from "@/service/groupChat.service";
import AuthHeader from "@/components/auth/authHeader";
import { Ionicons } from "@expo/vector-icons";

// Safe import — expo-notifications native module may not be available in Expo Go
let NotificationsBadge: { setBadgeCountAsync: (n: number) => Promise<void> } | null = null;
try {
  NotificationsBadge = require("expo-notifications").Notifications;
} catch {}

export interface ApiNotificationItem {
  id: string;
  recipientId: string;
  actorId: string | null;
  /** The user who triggered it (joined by the backend); null for system notifications. */
  actor?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    profilePictureUrl?: string | null;
  } | null;
  type: string;
  targetType: string | null;
  targetId: string | null;
  commentId?: string | null;
  /** Set by the backend on group_message notifications from 1:1 conversations */
  isDM?: boolean;
  isRead: boolean;
  createdAt: string;
  message?: string;
}

export interface NotificationUI extends ApiNotificationItem {
  read: boolean;
  category: "message" | "marketplace" | "hostel" | "leaderboard" | "general";
  section: "Today" | "Yesterday" | "This Week" | "Older";
}

function mapApiToUiNotifications(
  items: ApiNotificationItem[]
): NotificationUI[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const createdDate = new Date(item.createdAt);

    let section: NotificationUI["section"] = "Older";
    if (isToday(createdDate)) {
      section = "Today";
    } else if (isYesterday(createdDate)) {
      section = "Yesterday";
    } else if (isThisWeek(createdDate)) {
      section = "This Week";
    }

    let category: NotificationUI["category"] = "general";
    if (item.type.includes("message") || item.type.includes("comment")) {
      category = "message";
    } else if (item.type.includes("marketplace")) {
      category = "marketplace";
    } else if (item.type.includes("hostel")) {
      category = "hostel";
    } else if (
      item.type.includes("level_up") ||
      item.type.includes("leaderboard")
    ) {
      category = "leaderboard";
    }

    return {
      ...item,
      read: item.isRead,
      category,
      section,
    };
  });
}

export default function NotificationScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Corrected store selectors matching useNotificationStore
  const setUnreadNotificationCount = useNotificationStore(
    (state) => state.setUnreadNotificationCount
  );
  const decrementNotificationCount = useNotificationStore(
    (state) => state.decrementNotificationCount
  );
  // Source of truth for "unread" everywhere (bell badge and header) — a
  // count derived from just the loaded page would undercount once there
  // are more notifications than a single page (see syncBadge below).
  const serverUnreadCount = useNotificationStore(
    (state) => state.unreadNotificationCount
  );

  const [filter, setFilter] = useState<NotificationFilter>("All");
  const [data, setData] = useState<NotificationUI[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const showSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Badge helper — must be defined before fetchNotifications so it can be referenced
  const syncBadge = async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      const serverCount = count ?? 0;
      setUnreadNotificationCount(serverCount);
      await NotificationsBadge?.setBadgeCountAsync(serverCount);
    } catch {
      // Best-effort — don't crash the app over a badge
    }
  };

  const fetchNotifications = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const response = await notificationService.getAllNotification(null, 30);
        const items: ApiNotificationItem[] = response?.items ?? response ?? [];
        const uiNotifications = mapApiToUiNotifications(items);

        setData(uiNotifications);
        setNextCursor(response?.nextCursor ?? null);

        // Sync badge from server (not local count, which only covers the loaded page)
        await syncBadge();
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setUnreadNotificationCount]
  );

  const loadMoreNotifications = useCallback(async () => {
    if (!nextCursor || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const response = await notificationService.getAllNotification(nextCursor, 30);
      const items: ApiNotificationItem[] = response?.items ?? [];
      setData((prev) => [...prev, ...mapApiToUiNotifications(items)]);
      setNextCursor(response?.nextCursor ?? null);
    } catch (error) {
      console.error("Failed to load more notifications:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, loading]);

  // Re-fetch every time user views screen
  // Notifications are only marked as read when the user taps on them (openNotification)
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(data.length > 0);
    }, [fetchNotifications, data.length])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Header/bell always show the true server-wide count — data only ever
  // holds the loaded pages, so filtering it undercounts once there are more
  // notifications than have been loaded.
  const unreadCount = serverUnreadCount;

  const filtered = useMemo(() => {
    switch (filter) {
      case "Unread":
        return data.filter((n) => !n.read);
      case "Messages":
        return data.filter((n) => n.category === "message");
      case "Marketplace":
        return data.filter((n) => n.category === "marketplace");
      case "Hostel":
        return data.filter((n) => n.category === "hostel");
      case "Leaderboard":
        return data.filter((n) => n.category === "leaderboard");
      default:
        return data;
    }
  }, [filter, data]);

  const today = useMemo(
    () => filtered.filter((n) => n.section === "Today"),
    [filtered]
  );
  const yesterday = useMemo(
    () => filtered.filter((n) => n.section === "Yesterday"),
    [filtered]
  );
  const week = useMemo(
    () => filtered.filter((n) => n.section === "This Week"),
    [filtered]
  );
  const older = useMemo(
    () => filtered.filter((n) => n.section === "Older"),
    [filtered]
  );

  const markAllRead = async () => {
    // Optimistic update
    setData((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
        isRead: true,
      }))
    );
    setUnreadNotificationCount(0);
    await NotificationsBadge?.setBadgeCountAsync(0);

    try {
      await notificationService.markAllAsRead();
      // Re-sync badge from server to ensure accuracy
      await syncBadge();
    } catch (err) {
      console.error("Failed to mark all as read on server:", err);
      // Re-sync to correct optimistic update if server call failed
      await syncBadge();
    }
  };

  const openNotification = async (notification: NotificationUI) => {
    // Mark as read locally + on server
    if (!notification.read) {
      setData((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, read: true, isRead: true }
            : item
        )
      );
      decrementNotificationCount(1);

      try {
        await notificationService.markAsRead(notification.id);
        // Sync badge from server after marking one as read
        await syncBadge();
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // DM message notifications must open the chat, not the group detail
    // screen. The backend flags them with `isDM`; older backends don't, so
    // fall back to checking the user's 1:1 conversation list.
    let dmData: Record<string, unknown> = {};
    if (notification.type === "group_message" && notification.targetId && notification.isDM) {
      dmData = {
        isDM: true,
        chatId: notification.targetId,
        senderProfile: notification.actor ?? undefined,
      };
    } else if (
      notification.type === "group_message" &&
      notification.targetId &&
      notification.isDM === undefined
    ) {
      try {
        const conversations = await GroupsApi.listDirectConversations();
        const dm = conversations?.find(
          (c: any) => c.id === notification.targetId && (c.type === "direct" || c.participant)
        );
        if (dm) {
          dmData = {
            isDM: true,
            chatId: dm.id,
            senderProfile: dm.participant ?? notification.actor ?? undefined,
          };
        }
      } catch (err) {
        console.error("Failed to resolve DM conversation:", err);
      }
    }

    // Navigate to the relevant screen based on notification type
    navigateFromNotification({
      notificationId: notification.id,
      type: notification.type,
      targetType: notification.targetType,
      targetId: notification.targetId,
      commentId: notification.commentId,
      ...dmData,
    });
  };

  const isEmpty =
    !loading &&
    today.length === 0 &&
    yesterday.length === 0 &&
    week.length === 0 &&
    older.length === 0;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >

      <ThemedView style={{ flex: 1 }}>
        {/* <NotificationHeader
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onSettings={() => router.push("/(features)/notificationSettingsScreen")}
      /> */}

  <AuthHeader
  showBackButton={true}
title="Notifications" subtitle={`${unreadCount} unread notifications`} 
  rightElement={
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 8 }}>
      

      {/* Mark All As Read */}
         <TouchableOpacity
            activeOpacity={0.85}
            onPress={markAllRead}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Ionicons
              name="checkmark-done"
              size={22}
              color="#7C3AED"
            />
          </TouchableOpacity>

          <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => router.push("/(features)/notificationSettingsScreen")}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        backgroundColor: "#7C3AED",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name="settings-outline"
                        size={22}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
    </View>
  }
/>

      <NotificationTabs value={filter} onChange={setFilter} />

      {loading ? (
        showSkeleton ? <NotificationListSkeleton /> : null
      ) : isEmpty ? (
        <EmptyNotification onPress={() => fetchNotifications()} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary || "#7C3AED"}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const distanceFromBottom =
              contentSize.height - (contentOffset.y + layoutMeasurement.height);
            if (distanceFromBottom < 200) {
              loadMoreNotifications();
            }
          }}
          scrollEventThrottle={200}
        >
          {today.length > 0 && (
            <NotificationSection
              title={t("misc.today")}
              data={today}
              onPress={openNotification}
            />
          )}

          {yesterday.length > 0 && (
            <NotificationSection
              title={t("misc.yesterday")}
              data={yesterday}
              onPress={openNotification}
            />
          )}

          {week.length > 0 && (
            <NotificationSection
              title={t("misc.thisWeek")}
              data={week}
              onPress={openNotification}
            />
          )}

          {older.length > 0 && (
            <NotificationSection
              title={t("misc.older")}
              data={older}
              onPress={openNotification}
            />
          )}

          {loadingMore && (
            <ThemedView style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.primary || "#7C3AED"} />
            </ThemedView>
          )}
        </ScrollView>
      )}
      </ThemedView>
  
    </SafeAreaView>
  );
}