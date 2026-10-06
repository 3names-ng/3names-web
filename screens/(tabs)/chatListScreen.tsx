import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DeviceEventEmitter,
  FlatList,
  RefreshControl,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";
import ChatItem from "@/components/chat/chatItem";
import ChatListSkeleton from "@/components/chat/chatItemSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { Group, GroupsApi } from "@/service/groupChat.service";
import { useAuthStore } from "@/store";
import { useNotificationStore } from "@/store/notificationStore";
import { usePinnedChatStore } from "@/store/pinnedChatStore";
import { useMessageCacheStore } from "@/store/messageCacheStore";
import { useCallHistoryStore } from "@/store/callHistoryStore";
import AuthHeader from "@/components/auth/authHeader";
import Stories from "@/components/home/stories";
import SocialButton from "@/components/auth/socialButton";
import { AlertBanner } from "@/components/alertBanner";
import { useTranslation } from "@/hooks/useTranslation";
import SearchInput from "@/components/search/searchInput";

export default function ChatListScreen() {
  const router = useRouter();
  const { openStoryId } = useLocalSearchParams<{ openStoryId?: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const pinnedIds = usePinnedChatStore((state) => state.pinnedIds);
  const missedCallCount = useCallHistoryStore((state) => state.missedCallCount);
  const clearMissedCalls = useCallHistoryStore((state) => state.clearMissedCalls);
  const unreadNotificationCount = useNotificationStore((state) => state.unreadNotificationCount);
  const setUnreadChatCount = useNotificationStore(
    (state) => state.setUnreadChatCount
  );

  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const showChatSkeleton = useDelayedLoading(loading);

  // Offline cache for the direct conversations list
  const cacheRehydrated = useMessageCacheStore((state) => state.rehydrated);
  const loadCachedDirectConversations = useMessageCacheStore(
    (state) => state.loadCachedDirectConversations,
  );
  const setCachedDirectConversations = useMessageCacheStore(
    (state) => state.setCachedDirectConversations,
  );

  // Show the saved conversation list instantly (works offline), then refresh
  useEffect(() => {
    if (!cacheRehydrated) return;
    const cached = loadCachedDirectConversations();
    if (cached && cached.length > 0) {
      setGroups(cached as Group[]);
      setLoading(false);
    }
  }, [cacheRehydrated, loadCachedDirectConversations]);

  // Fetch groups and compute total unread chats
  const fetchGroups = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await GroupsApi.listDirectConversations();
        const rawList: Group[] = data || [];

        // Normalize direct conversation items so participant details populate top-level display fields
        const conversationList = rawList.map((item: any) => {
       
          const lastMessageObj =
            item.lastMessage && typeof item.lastMessage === "object"
              ? item.lastMessage
              : null;
          const lastMessageAt =
            item.lastMessageAt ??
            lastMessageObj?.createdAt ??
            item.updatedAt ??
            null;
          const lastMessageContent =
            typeof item.lastMessage === "string"
              ? item.lastMessage
              : (lastMessageObj?.content ?? item.lastMessageContent ?? "");

          if (item.type === "direct" && item.participant) {
            const fullName = `${item.participant.firstName || ""} ${
              item.participant.lastName || ""
            }`.trim();
            const displayName =
              fullName || item.participant.username || "Unknown User";

            return {
              ...item,
              displayName,
              displayImage: item.participant.profilePictureUrl || item.iconUrl,
              lastMessageAt,
              lastMessage: lastMessageContent,
            };
          }

          return {
            ...item,
            displayName: item.name || "Group Chat",
            displayImage: item.iconUrl,
            lastMessageAt,
            lastMessage: lastMessageContent,
          };
        });

        setGroups(conversationList);
        setCachedDirectConversations(conversationList);

        const unreadTotal = conversationList.reduce((acc, curr: any) => {
          if (typeof curr.unreadCount === "number") return acc + curr.unreadCount;
          if (curr.hasUnread || curr.unread) return acc + 1;
          return acc;
        }, 0);

        setUnreadChatCount(unreadTotal);
      } catch (error: any) {
       
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setUnreadChatCount, setCachedDirectConversations]
  );

  const onRefresh = useCallback(() => {
    fetchGroups(true);
  }, [fetchGroups]);

  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [fetchGroups])
  );

  // Real-time: when any user updates their profile (frame, picture, name),
  // patch the conversation list so avatars/names update immediately.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "PROFILE_FRAME_UPDATED",
      (data: { userId: string; profileFrame?: string | null; profilePictureUrl?: string | null; username?: string | null }) => {
        if (!data?.userId) return;
        setGroups((prev) =>
          prev.map((group: any) => {
            if (group.participant?.id !== data.userId) return group;
            return {
              ...group,
              participant: {
                ...group.participant,
                ...(data.profileFrame !== undefined && { profileFrame: data.profileFrame }),
                ...(data.profilePictureUrl !== undefined && { profilePictureUrl: data.profilePictureUrl }),
                ...(data.username !== undefined && { username: data.username })
              },
              ...(data.profilePictureUrl !== undefined && { displayImage: data.profilePictureUrl }),
              ...(data.username !== undefined && {
                displayName: data.username || group.displayName,
              }),
            };
          })
        );
      },
    );
    return () => sub.remove();
  }, []);

  // Filter groups by search term using normalized displayName and username
  const filteredGroups = useMemo(() => {
    let list = groups;
    if (search.trim()) {
      list = groups.filter((g: any) => {
        const nameMatch = (g.displayName || "").toLowerCase();
        const usernameMatch = (g.participant?.username || "").toLowerCase();
        const query = search.toLowerCase();
        return nameMatch.includes(query) || usernameMatch.includes(query);
      });
    }
    // Sort pinned chats to the top
    return [...list].sort((a: any, b: any) => {
      const aPinned = Boolean(pinnedIds[a.id]) || Boolean(a.isPinned);
      const bPinned = Boolean(pinnedIds[b.id]) || Boolean(b.isPinned);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [groups, search, pinnedIds]);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="default" />

      {/* Screen Header */}
    <AuthHeader
  showBackButton={false}
  title={t("chat.title")}
  subtitle={t("chat.subtitle")}
  rightElement={
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 8 }}>
      {/* Call History Button with missed call badge */}
      {/* <TouchableOpacity
        onPress={() => {
          clearMissedCalls();
          router.push("/(features)/callHistoryScreen" as any);
        }}
        style={{ padding: 6 }}
      >
        <View>
          <Ionicons
            name="call-outline"
            size={24}
            color={colors.primary || "#7C3AED"}
          />
          {missedCallCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: "#EF4444",
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 4,
              }}
            >
              <ThemedText
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {missedCallCount > 99 ? "99+" : missedCallCount}
              </ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity> */}

      {/* Notification Bell */}
      <TouchableOpacity
        onPress={() => router.push("/(features)/notificationScreen")}
        style={{ padding: 6 }}
      >
        <View>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.primary || "#7C3AED"}
          />
          {unreadNotificationCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: "#EF4444",
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 4,
              }}
            >
              <ThemedText
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  }
/>

      {/* Chats List with Integrated Header Components */}
      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary || "#7C3AED"}
            colors={[colors.primary || "#7C3AED"]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Stories Section */}
            <View style={{ marginBottom: 12 }}>
              <Stories openStoryId={openStoryId} />
            </View>

            {/* Search Bar */}
            {/* <View
              style={{
                marginHorizontal: 20,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 15,
                height: 50,
              }}
            >
              <Ionicons name="search" size={20} color={colors.secondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("chat.searchPlaceholder")}
                placeholderTextColor={colors.secondary}
                textAlignVertical="center"
                includeFontPadding={false}
                style={{
                  flex: 1,
                  height: "100%",
                  marginLeft: 10,
                  color: colors.text,
                  fontSize: 16,
                  padding: 0,
                }}
              />
            </View> */}
           <View className=" px-5 py-4">
                 <SearchInput value={search} onChangeText={setSearch} />
           </View>
          </View>
        }
        renderItem={({ item }) => (
          <ChatItem
            item={{
              ...(item as any),
              isPinned: Boolean(pinnedIds[item.id]) || Boolean((item as any).isPinned),
            }}
            onPress={() =>
              router.push({
                pathname: "/chatScreen",
                params: {
                  id: item.id,
                  isUserId: user?.id,
                  user: JSON.stringify(item?.participant),
                },
              })
            }
          />
        )}
        ListEmptyComponent={
          loading ? (
            showChatSkeleton ? <ChatListSkeleton /> : null
          ) : (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={60}
                color={colors.secondary}
              />
              <ThemedText
                style={{ marginTop: 12, fontSize: 18, fontWeight: "700" }}
              >
                No conversations
              </ThemedText>
              <ThemedText style={{ marginTop: 4, color: colors.secondary }}>
                Try starting a new conversation
              </ThemedText>
            </View>
          )
        }
      />

   

      {/* Floating Action Button */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={{
          position: "absolute",
          right: 25,
          bottom: 120,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary || "#7C3AED",
          justifyContent: "center",
          alignItems: "center",
          elevation: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4.65,
        }}
        onPress={() => {
          if (!user?.id) return;
          router.push({
            pathname: "/followersFollowingScreen",
            params: {
              userId: user.id,
              initialTab: "followers",
              username: user.username,
            },
          });
        }}
      >
        <Ionicons name="create" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}