import React, { useEffect } from "react";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import FloatingTabButton from "@/components/FloatingTabButton";
import { useAuthStore } from "@/store/authStore";
import { useTranslation } from "@/hooks/useTranslation";

import { notificationService } from "@/service/notification.service";
import { GroupsApi } from "@/service/groupChat.service";
import { useNotificationStore } from "@/store/notificationStore";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { useTheme } from "@/hooks/useTheme";

export default function TabLayout() {
  const { isHydrated, isAuthenticated } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
const {colors, isDark} = useTheme()
  // Global store values
  const chatCount = useNotificationStore((state) => state.unreadChatCount);
  const notificationCount = useNotificationStore(
    (state) => state.unreadNotificationCount
  );

  const setUnreadNotificationCount = useNotificationStore(
    (state) => state.setUnreadNotificationCount
  );
  const setUnreadChatCount = useNotificationStore(
    (state) => state.setUnreadChatCount
  );

  // Initial preload on app layout mount
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch unread notification count
      notificationService
        .getUnreadCount()
        .then(({ count }) => {
          setUnreadNotificationCount(count ?? 0);
        })
        .catch((err) =>
          console.error("Error loading initial notifications:", err)
        );

      // Fetch Direct Conversations
      GroupsApi.listDirectConversations()
        .then((conversations) => {
          if (Array.isArray(conversations)) {
            const unread = conversations.reduce((acc, curr: any) => {
              if (typeof curr.unreadCount === "number") return acc + curr.unreadCount;
              if (curr.hasUnread || curr.unread) return acc + 1;
              return acc;
            }, 0);
            setUnreadChatCount(unread);
          }
        })
        .catch((err) => console.error("Error loading initial chats:", err));
    }
  }, [isAuthenticated, setUnreadNotificationCount, setUnreadChatCount]);

  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return <Redirect href="/auth/loginScreen" />;
  }

  // Combine chat and notification counts
  const totalUnreadCount = (chatCount || 0) + (notificationCount || 0);
  const totalBadgeText = totalUnreadCount > 99 ? "99+" : totalUnreadCount;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6C3EF4",
        tabBarInactiveTintColor: isDark ? "#A3A3A3" : "#7B7B7B",
        tabBarShowLabel: true,

        tabBarStyle: {
          height: 82,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: isDark ? "#171717" : "#FFFFFF",
          borderTopWidth: 0,
       
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          position: "absolute",
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 4,
     
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("tab.home"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* MATERIALS */}
      <Tabs.Screen
        name="materials"
        options={{
          title: t("tab.materials"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* CENTER CREATE BUTTON */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "",
          tabBarButton: (props) => <FloatingTabButton {...props} />,
        }}
      />

      {/* CHAT LIST / INBOX */}
      <Tabs.Screen
        name="chatListScreen"
        options={{
          title: t("tab.messages"),
          tabBarBadge: totalUnreadCount > 0 ? totalBadgeText : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#FF3B30",
            fontSize: 10,
            lineHeight: 14,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tab.profile"),
          tabBarIcon: ({ color, size, focused }) => (
            <ProfileFrame
              frameId={user?.profileFrame}
              uri={user?.profilePictureUrl}
              size={size + 4}
              initial={user?.username?.[0]?.toUpperCase()}
              // fallbackColor={focused ? "#6C3EF4" : color}
            />
          ),
        }}
      />
    </Tabs>
  );
}