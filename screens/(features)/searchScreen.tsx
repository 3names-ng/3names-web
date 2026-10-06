import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  DeviceEventEmitter,
  ScrollView,
  View,
  StyleSheet,
} from "react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

import SearchInput from "@/components/search/searchInput";
import TrendingUserCard, { type TrendingUser } from "@/components/search/trendingUserCard";
import { searchService, type SearchUserItem } from "@/service/search.service";
import { userService } from "@/service/profile.Service";
import RecentUserCard from "@/components/search/recentSearchCard";
import { SearchResultsSkeleton, SearchSectionsSkeleton } from "@/components/search/searchSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import AuthHeader from "@/components/auth/authHeader";
import { useAuthStore } from "@/store/authStore";
import { useRecentSearchStore } from "@/store/recentSearchStore";
import { useTranslation } from "@/hooks/useTranslation";

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  // Default Discovery State
  const recentSearches = useRecentSearchStore((s) => s.items);
  const addRecent = useRecentSearchStore((s) => s.addItem);
  const clearRecent = useRecentSearchStore((s) => s.clearAll);
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUserItem[]>([]);
  const [trendingUsers, setTrendingUsers] = useState<SearchUserItem[]>([]);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [loading, setLoading] = useState(true);

  // Search Results State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const showSectionsSkeleton = useDelayedLoading(loading);
  const showResultsSkeleton = useDelayedLoading(isSearching);

  // Helper state updater for toggling follow across all user lists
  const updateRecentItem = useRecentSearchStore((s) => s.updateItem);

  const updateListsFollowStatus = useCallback((targetUserId: string, isFollowing: boolean) => {
    const updateItem = (item: SearchUserItem) =>
      item.id === targetUserId ? { ...item, isFollowing } : item;

    updateRecentItem(targetUserId, { isFollowing });
    setSuggestedUsers((prev) => prev.map(updateItem));
    setTrendingUsers((prev) => prev.map(updateItem));
    setSearchResults((prev) => prev.map(updateItem));
  }, [updateRecentItem]);

  // Listen for global follow changes triggered from other screens
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "USER_FOLLOW_TOGGLED",
      ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
        updateListsFollowStatus(userId, isFollowing);
      }
    );

    return () => subscription.remove();
  }, [updateListsFollowStatus]);

  // Real-time: when any user updates their profile (frame, picture, name),
  // patch all user lists so avatars/names update immediately.
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      "PROFILE_FRAME_UPDATED",
      (data: { userId: string; profileFrame?: string | null; profilePictureUrl?: string | null; username?: string | null }) => {
        if (!data?.userId) return;
        const patchUser = (item: SearchUserItem) => {
          if (item.id !== data.userId) return item;
          return {
            ...item,
            ...(data.profileFrame !== undefined && { profileFrame: data.profileFrame }),
            ...(data.profilePictureUrl !== undefined && { profilePictureUrl: data.profilePictureUrl }),
            ...(data.username !== undefined && { username: data.username ?? item.username }),
          };
        };
        setSuggestedUsers((prev) => prev.map(patchUser));
        setTrendingUsers((prev) => prev.map(patchUser));
        setSearchResults((prev) => prev.map(patchUser));
        updateRecentItem(data.userId, {
          ...(data.profileFrame !== undefined && { profileFrame: data.profileFrame }),
          ...(data.profilePictureUrl !== undefined && { profilePictureUrl: data.profilePictureUrl }),
          ...(data.username !== undefined && { username: data.username ?? undefined }),
        });
      },
    );
    return () => sub.remove();
  }, [updateRecentItem]);

  // Handle Follow / Unfollow Action
  const handleFollowUser = useCallback(
    async (targetUserId: string) => {
      const allUsers = [...recentSearches, ...suggestedUsers, ...trendingUsers, ...searchResults];
      const targetUser = allUsers.find((u) => u.id === targetUserId);
      const currentlyFollowing = !!targetUser?.isFollowing;
      const nextFollowingState = !currentlyFollowing;

      // 1. Optimistic Update locally
      updateListsFollowStatus(targetUserId, nextFollowingState);

      // 2. Broadcast globally
      DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
        userId: targetUserId,
        isFollowing: nextFollowingState,
      });

      // 3. API Request
      try {
        if (currentlyFollowing) {
          await userService.unfollowUser(targetUserId);
        } else {
          await userService.followUser(targetUserId);
        }
      } catch (error) {
        console.error("❌ Failed to update follow status:", error);

        // Rollback state on error
        updateListsFollowStatus(targetUserId, currentlyFollowing);

        DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
          userId: targetUserId,
          isFollowing: currentlyFollowing,
        });

        throw error;
      }
    },
    [recentSearches, suggestedUsers, trendingUsers, searchResults, updateListsFollowStatus]
  );

  // 1. Initial Load for Discovery Data
  const loadDiscoveryData = useCallback(async () => {
    try {
      setLoading(true);

      const [suggestedResult, trendingResult] =
        await Promise.allSettled([
          searchService.getSuggestedUsers(8),
          searchService.getTrendingUsers(8),
        ]);

      const excludeId = currentUserId;

      if (suggestedResult.status === "fulfilled") {
        const rawSuggested = suggestedResult.value;
        const items = (Array.isArray(rawSuggested) ? rawSuggested : rawSuggested?.items || [])
          .filter((u: any) => u.id !== excludeId);
        setSuggestedUsers(items);
      } else {
        console.error("❌ Suggested Users Error:", suggestedResult.reason);
      }

      if (trendingResult.status === "fulfilled") {
        const rawTrending = trendingResult.value;
        const items = (Array.isArray(rawTrending) ? rawTrending : rawTrending?.items || [])
          .filter((u: any) => u.id !== excludeId);
        setTrendingUsers(items);
      } else {
        console.error("❌ Trending Users Error:", trendingResult.reason);
      }
    } catch (error) {
      console.error("💥 [SearchScreen] Error loading discovery data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscoveryData();
  }, [loadDiscoveryData]);

  // 2. Dynamic Live Search Effect
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await searchService.searchUsers(
          trimmedQuery,
          15,
          controller.signal
        );

        const items = Array.isArray(response)
          ? response
          : response?.items || [];

        setSearchResults(items);
      } catch (error: any) {
        if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
          console.error("❌ [SearchScreen] Search query failed:", error);
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // 3. Save Search & Navigate to User Profile
  const handleSelectUser = useCallback(
    async (user: SearchUserItem) => {
      try {
        addRecent(user);
      } catch (error) {
        console.error("Failed to add recent search:", error);
      }

      router.push(`/(features)/userProfile/${user.id}`);
    },
    [router]
  );

  const handleClearAllRecent = useCallback(() => {
    clearRecent();
  }, [clearRecent]);

  // Helper mapper to construct TrendingUser shape safely
  const mapToCardUser = (user: SearchUserItem, rank?: number): TrendingUser => {
    return {
      id: user.id,
      name: user.username,
      username: user.username,
      avatar:
        user.profilePictureUrl ||
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      school: user.school?.name || undefined,
      faculty: user.faculty?.name || undefined,
      department: user.department?.name || undefined,
      bio: user.bio || "",
      verified: false,
      isFollowing: user.isFollowing,
      rank,
      profileFrame: user.profileFrame,
      appLevel: user.appLevel || null,
    };
  };

  const mappedRecentSearches = useMemo(() => {
    return recentSearches.map((user) => ({
      rawUser: user,
      cardUser: mapToCardUser(user),
    }));
  }, [recentSearches]);

  const mappedSuggestedUsers = useMemo(() => {
    return suggestedUsers.map((user) => ({
      rawUser: user,
      cardUser: mapToCardUser(user),
    }));
  }, [suggestedUsers]);

  const mappedTrendingUsers = useMemo(() => {
    return trendingUsers.map((user, index) => ({
      rawUser: user,
      cardUser: mapToCardUser(user, index + 1),
    }));
  }, [trendingUsers]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: isDark ? "#111827" : "#fff",
      }}
    >
      <AuthHeader title={t("search.title")} subtitle={t("search.subtitle")}/>
     
<View className=" px-5 py-4">
      <SearchInput value={searchQuery} onChangeText={setSearchQuery} />
</View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {loading ? (
          showSectionsSkeleton ? <SearchSectionsSkeleton /> : null
        ) : searchQuery.trim().length > 0 ? (
          <ThemedView className="mt-6 px-5">
            <ThemedText className="text-sm color-gray-500 mb-4">
              {t("search.showingResults", { query: searchQuery })}
            </ThemedText>

            {isSearching ? (
              showResultsSkeleton ? <SearchResultsSkeleton /> : null
            ) : searchResults.length > 0 ? (
              <ThemedView className="gap-3">
                {searchResults.map((rawUser) => {
                  const cardUser = mapToCardUser(rawUser);

                  return (
                    <RecentUserCard
                      key={rawUser.id}
                      user={cardUser}
                      onPress={() => handleSelectUser(rawUser)}
                      onFollow={() => handleFollowUser(rawUser.id)}
                    />
                  );
                })}
              </ThemedView>
            ) : (
              <ThemedView className="mt-10 items-center">
                <ThemedText className="text-gray-400">
                  {t("search.noResultsFound", { query: searchQuery })}
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        ) : (
          <>
            {/* Recent Searches Section (Horizontal Scroll using TrendingCard) */}
            <ThemedView className="mt-8">
              <ThemedView className="px-5 flex-row justify-between items-center">
                <ThemedText className="text-xl font-bold">
                  {t("search.recentSearches", { count: mappedRecentSearches.length })}
                </ThemedText>
                {mappedRecentSearches.length > 0 && (
                  <ThemedText
                    onPress={handleClearAllRecent}
                    className="text-[#6F3FF5]"
                  >
                    {t("search.clearAll")}
                  </ThemedText>
                )}
              </ThemedView>

              {mappedRecentSearches.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  className="mt-4"
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {mappedRecentSearches.map(({ rawUser, cardUser }) => (
                    <View key={cardUser.id} style={styles.horizontalCardMargin}>
                      <RecentUserCard
                        user={cardUser}
                        onPress={() => handleSelectUser(rawUser)}
                        onFollow={() => handleFollowUser(rawUser.id)}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <ThemedView className="px-5 mt-2">
                  <ThemedText className="text-gray-500 text-sm">
                    {t("search.noRecentSearches")}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Suggested Students Section */}
            <ThemedView className="mt-8">
              <ThemedView className="px-5 flex-row justify-between items-center">
                <ThemedText className="text-xl font-bold">
                  {t("search.suggestedStudents")}
                </ThemedText>
              </ThemedView>

              {mappedSuggestedUsers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  className="mt-4"
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {mappedSuggestedUsers.map(({ rawUser, cardUser }) => (
                    <View key={cardUser.id} style={styles.horizontalCardMargin}>
                      <TrendingUserCard
                        user={cardUser}
                        onPress={() => handleSelectUser(rawUser)}
                        onFollow={() => handleFollowUser(rawUser.id)}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <ThemedView className="px-5 mt-2">
                  <ThemedText className="text-gray-500 text-sm">
                    {t("search.noSuggestedStudents")}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {/* Trending Students Section */}
            <ThemedView className="mt-8">
              <ThemedView className="px-5 flex-row justify-between items-center">
                <ThemedText className="text-xl font-bold">
                  {t("search.trendingStudents")}
                </ThemedText>
              </ThemedView>

              {mappedTrendingUsers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  className="mt-4"
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                  {mappedTrendingUsers.map(({ rawUser, cardUser }) => (
                    <View key={cardUser.id} style={styles.horizontalCardMargin}>
                      <TrendingUserCard
                        user={cardUser}
                        onPress={() => handleSelectUser(rawUser)}
                        onFollow={() => handleFollowUser(rawUser.id)}
                      />
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <ThemedView className="px-5 mt-2">
                  <ThemedText className="text-gray-500 text-sm">
                    {t("search.noTrendingStudents")}
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  horizontalCardMargin: {
    marginRight: 14,
    minWidth: 280,
  },
});