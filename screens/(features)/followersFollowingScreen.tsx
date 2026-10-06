import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar,
  DeviceEventEmitter,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Search, UserCheck, UserPlus, X } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { userService } from "@/service/profile.Service";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { showError } from "@/components/ui/toast";
import { LevelBadge } from "@/components/levelBadge";
import { AppLevel, useAuthStore } from "@/store";
import { ThemedText } from "@/components/ui/ThemedText";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { useDelayedLoading } from "@/components/ui/skeleton";
import UserListSkeleton from "@/components/ui/userRowSkeleton";

export interface UserFollowItem {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  bio?: string;
  isFollowing?: boolean;
  appLevel: AppLevel;
}

type TabType = "followers" | "following";

const PAGE_LIMIT = 20;

export default function FollowersFollowingScreen() {
  const router = useRouter();
  const { userId, initialTab = "followers", username } = useLocalSearchParams<{
    userId: string;
    initialTab?: TabType;
    username?: string;
  }>();

  const user = useAuthStore((state) => state.user);

  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const primaryAccent = colors.primary || "#7C3AED";

  const [activeTab, setActiveTab] = useState<TabType>(
    initialTab === "following" ? "following" : "followers"
  );

  // List states
  const [followers, setFollowers] = useState<UserFollowItem[]>([]);
  const [following, setFollowing] = useState<UserFollowItem[]>([]);

  // Pagination cursors
  const [followersCursor, setFollowersCursor] = useState<string | null>(null);
  const [followingCursor, setFollowingCursor] = useState<string | null>(null);

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const showSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  const [mutatingUserIds, setMutatingUserIds] = useState<Record<string, boolean>>({});

  // Search Debounce handler (500ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Initial or Refreshed Data
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;

      try {
        if (activeTab === "followers") {
          const res = await userService.getFollowers(userId, {
            search: debouncedSearch,
            limit: PAGE_LIMIT,
          });
          setFollowers(res.items || []);
          setFollowersCursor(res.nextCursor || null);
        } else {
          const res = await userService.getFollowing(userId, {
            search: debouncedSearch,
            limit: PAGE_LIMIT,
          });
          setFollowing(res.items || []);
          setFollowingCursor(res.nextCursor || null);
        }
      } catch (err: any) {
        console.error(`Failed to load ${activeTab}:`, err);
        showError(`${t("followers.couldNotLoad")} ${activeTab}`, t("error.error"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId, activeTab, debouncedSearch]
  );

  // Trigger data fetch on tab, search query, or mount change
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [activeTab, debouncedSearch, fetchData]);

  // Load Next Page (Infinite Scroll)
  const loadMoreData = async () => {
    const currentCursor = activeTab === "followers" ? followersCursor : followingCursor;

    if (!currentCursor || loadingMore || loading || refreshing) return;

    setLoadingMore(true);
    try {
      if (activeTab === "followers") {
        const res = await userService.getFollowers(userId, {
          search: debouncedSearch,
          limit: PAGE_LIMIT,
          cursor: currentCursor,
        });
        setFollowers((prev) => [...prev, ...(res.items || [])]);
        setFollowersCursor(res.nextCursor || null);
      } else {
        const res = await userService.getFollowing(userId, {
          search: debouncedSearch,
          limit: PAGE_LIMIT,
          cursor: currentCursor,
        });
        setFollowing((prev) => [...prev, ...(res.items || [])]);
        setFollowingCursor(res.nextCursor || null);
      }
    } catch (err: any) {
      console.error(`Failed to load more ${activeTab}:`, err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Pull to Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // Global Sync Event Listener
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "USER_FOLLOW_TOGGLED",
      (event: { userId: string; isFollowing: boolean }) => {
        const updateList = (list: UserFollowItem[]) =>
          list.map((u) =>
            u.id === event.userId ? { ...u, isFollowing: event.isFollowing } : u
          );

        setFollowers((prev) => updateList(prev));
        setFollowing((prev) => updateList(prev));
      }
    );

    return () => subscription.remove();
  }, []);

  // Real-time: when any user updates their profile (frame, picture, name),
  // patch both followers and following lists immediately.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "PROFILE_FRAME_UPDATED",
      (data: { userId: string; profileFrame?: string | null; profilePictureUrl?: string | null; username?: string | null }) => {
        if (!data?.userId) return;
        const updateList = (list: UserFollowItem[]) =>
          list.map((u: any) => {
            if (u.id !== data.userId) return u;
            return {
              ...u,
              ...(data.profileFrame !== undefined && { profileFrame: data.profileFrame }),
              ...(data.profilePictureUrl !== undefined && { profilePictureUrl: data.profilePictureUrl }),
              ...(data.username !== undefined && { username: data.username }),
            };
          });
        setFollowers((prev) => updateList(prev));
        setFollowing((prev) => updateList(prev));
      },
    );
    return () => sub.remove();
  }, []);

  // Handle Follow / Unfollow Optimistically
  const handleFollowToggle = async (targetUser: UserFollowItem) => {
    const targetId = targetUser.id;
    if (mutatingUserIds[targetId]) return;

    const previousState = targetUser.isFollowing ?? false;
    const nextState = !previousState;

    setMutatingUserIds((prev) => ({ ...prev, [targetId]: true }));

    const applyOptimistic = (list: UserFollowItem[]) =>
      list.map((u) => (u.id === targetId ? { ...u, isFollowing: nextState } : u));

    setFollowers((prev) => applyOptimistic(prev));
    setFollowing((prev) => applyOptimistic(prev));

    DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
      userId: targetId,
      isFollowing: nextState,
    });

    try {
      if (previousState) {
        await userService.unfollowUser(targetId);
      } else {
        await userService.followUser(targetId);
      }
    } catch (err) {
      console.error("Failed follow toggle:", err);

      const rollback = (list: UserFollowItem[]) =>
        list.map((u) => (u.id === targetId ? { ...u, isFollowing: previousState } : u));

      setFollowers((prev) => rollback(prev));
      setFollowing((prev) => rollback(prev));

      DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
        userId: targetId,
        isFollowing: previousState,
      });

      showError(t("followers.couldNotUpdate"), t("error.error"));
    } finally {
      setMutatingUserIds((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  // Navigate to user profile page
  const handleNavigateToProfile = (targetUserId: string) => {
    router.push({
      pathname: "/userProfile/[id]",
      params: { id: targetUserId },
    });
  };

  const currentList = activeTab === "followers" ? followers : following;

  const renderUserCard = ({ item }: { item: UserFollowItem }) => {
    const isMutating = mutatingUserIds[item.id];
    const isFollowing = item.isFollowing ?? false;
    const isCurrentUser = user?.id === item.id;

    return (
      <View
        style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Pressable
          style={styles.userClickableArea}
          onPress={() => handleNavigateToProfile(item.id)}
        >
          <View style={styles.avatarContainer}>
            <ProfileFrame
              frameId={(item as any).profileFrame}
              uri={item.profilePictureUrl}
              size={48}
              initial={item.username?.[0]?.toUpperCase()}
              fallbackColor={colors.border}
            />
          </View>

          <View style={styles.userInfo}>
            <ThemedText style={[styles.usernameText, { color: colors.muted, marginBottom: 2 }]} numberOfLines={1}>
              {item.username}
            </ThemedText>
            <LevelBadge level={item?.appLevel} />
          </View>
        </Pressable>

        {/* Hide action button if this is the authenticated user */}
        {!isCurrentUser && (
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: isFollowing ? colors.background : primaryAccent },
              isFollowing && { borderWidth: 1, borderColor: colors.border },
            ]}
            onPress={() => handleFollowToggle(item)}
            disabled={isMutating}
          >
            {isMutating ? (
              <ActivityIndicator size="small" color={isFollowing ? colors.text : "#FFFFFF"} />
            ) : isFollowing ? (
              <>
                <UserCheck size={14} color={colors.text} />
                <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>Following</ThemedText>
              </>
            ) : (
              <>
                <UserPlus size={14} color="#FFFFFF" />
                <ThemedText style={[styles.actionButtonText, { color: "#FFFFFF" }]}>Follow</ThemedText>
              </>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={primaryAccent} />
      </View>
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
          {username ? `@${username}` : "Network"}
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderColor: colors.border }]}>
        <Pressable
          style={[styles.tabItem, activeTab === "followers" && { borderBottomColor: primaryAccent }]}
          onPress={() => {
            if (activeTab !== "followers") {
              setSearchQuery("");
              setActiveTab("followers");
            }
          }}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "followers" ? primaryAccent : colors.muted },
            ]}
          >
            Followers
          </ThemedText>
        </Pressable>

        <Pressable
          style={[styles.tabItem, activeTab === "following" && { borderBottomColor: primaryAccent }]}
          onPress={() => {
            if (activeTab !== "following") {
              setSearchQuery("");
              setActiveTab("following");
            }
          }}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "following" ? primaryAccent : colors.muted },
            ]}
          >
            Following
          </ThemedText>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <X size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* List Body */}
      {loading ? (
        showSkeleton ? <UserListSkeleton label={`Loading ${activeTab}`} /> : null
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={primaryAccent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                {searchQuery ? t("search.noResults") : `${t("followers.noFollowers")}`}
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: colors.text }]}>
                {searchQuery
                  ? `We couldn't find anyone matching "${searchQuery}"`
                  : activeTab === "followers"
                  ? "When users follow this account, they'll show up here."
                  : "Accounts followed by this user will appear here."}
              </ThemedText>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 44,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIconButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  userClickableArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  initialText: {
    fontSize: 18,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  usernameText: {
    fontSize: 15,
    marginTop: 1,
    marginBottom: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minWidth: 95,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});