import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  DeviceEventEmitter,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  GraduationCap,
  Library,
  School,
  ArrowLeft,
  Share2,
  UserCheck,
  UserPlus,
  Ban,
  ShieldAlert,
  X,
  UserX,
} from "lucide-react-native";
import { LevelBadge } from "@/components/levelBadge";
import { showError, showSuccess } from "@/components/ui/toast";
import { userService } from "@/service/profile.Service";
import { postService } from "@/service/post.service";
import { useTheme } from "@/hooks/useTheme";
import { AppLevel } from "@/store/authStore";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import ImageViewer from "@/components/ui/ImageViewer";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import UserProfileSkeleton from "@/components/profile/userProfileSkeleton";
import PostGridSkeleton from "@/components/profile/postGridSkeleton";

interface EntityMeta {
  id?: string;
  name?: string;
}

interface User {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  bio?: string;
  appLevel?: AppLevel;
  school?: EntityMeta;
  faculty?: EntityMeta;
  department?: EntityMeta;
  isFollowing?: boolean;
  isBlocked?: boolean;
  isPrivateProfile?: boolean;
}

interface UserProfileStats {
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  likesCount?: number;
}

type TabType = "posts" ;

export default function PublicUserProfileScreen() {
  const router = useRouter();
  const { id, user: rawUserParam, post } = useLocalSearchParams<{
    id: string;
    user?: string;
    post?: any;
  }>();

  // Parse navigation params safely
  const userFromParam = useMemo(() => {
    if (!rawUserParam) return null;
    try {
      return typeof rawUserParam === "string"
        ? JSON.parse(rawUserParam)
        : rawUserParam;
    } catch (e) {
      console.warn("Failed to parse route user param:", e);
      return null;
    }
  }, [rawUserParam]);

  const { colors, isDark } = useTheme();
  const primaryAccent = colors.primary || "#7C3AED";

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserProfileStats | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [isFollowMutating, setIsFollowMutating] = useState<boolean>(false);
  const [avatarVisible, setAvatarVisible] = useState<boolean>(false);

  // User posts grid
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const gridCellSize = Dimensions.get("window").width / 3;

  // 1. Safely parse post if it comes in as a JSON string from params
  const parsedPost = useMemo(() => {
    if (!post) return null;
    if (typeof post === "object") return post;
    try {
      return JSON.parse(post);
    } catch (e) {
      console.error("Failed to parse post param:", e);
      return null;
    }
  }, [post]);

  // Modal and Block States (Initial state resolved from params)
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(() => {
    if (userFromParam?.isBlocked !== undefined) return Boolean(userFromParam.isBlocked);
    if (parsedPost?.user?.isBlocked !== undefined) return Boolean(parsedPost.user.isBlocked);
    return false;
  });
  const [isBlockMutating, setIsBlockMutating] = useState<boolean>(false);

  // Real-time patches pushed in from other screens (frame / picture / name
  // changed elsewhere). Held as state because `displayUser` is derived below
  // and therefore has no setter of its own.
  const [liveUserPatch, setLiveUserPatch] = useState<Record<string, any>>({});

  // Merge User route params + loaded state
  const displayUser = useMemo(() => {
    const base = !targetUser
      ? userFromParam
      : {
          ...userFromParam,
          ...targetUser,
          school: targetUser?.school || userFromParam?.school,
          faculty: targetUser?.faculty || userFromParam?.faculty,
          department: targetUser?.department || userFromParam?.department,
          appLevel: targetUser?.appLevel || userFromParam?.appLevel,
        };
    if (!base) return base;
    return { ...base, ...liveUserPatch };
  }, [targetUser, userFromParam, liveUserPatch]);

  // Initial Resolver for target follow state
  const resolveIsFollowing = useCallback(
    (postData: any, userObj: any): boolean => {
      if (postData) {
        const u = postData.user ?? postData;
        const rawValue = u?.isFollowing;
        if (rawValue !== undefined) {
          return typeof rawValue === "boolean"
            ? rawValue
            : String(rawValue).toLowerCase() === "true";
        }
      }

      if (userObj?.isFollowing !== undefined) {
        return typeof userObj.isFollowing === "boolean"
          ? userObj.isFollowing
          : String(userObj.isFollowing).toLowerCase() === "true";
      }

      return false;
    },
    []
  );

  const [isFollowing, setIsFollowing] = useState<boolean>(() =>
    resolveIsFollowing(parsedPost, userFromParam)
  );

  const fetchUserData = useCallback(async () => {
    const targetUserId = id || displayUser?.id;
    if (!targetUserId) return;

    try {
      setError(null);

      // Concurrently fetch profile, stats, follow status, and blocker status
      const [userData, statsData, followCheckData, blockerCheckData] = await Promise.allSettled([
        userService.getUserById(targetUserId),
        userService.getUserStatsById(targetUserId),
        userService.checkIsFollowing(targetUserId),
        userService.checkIsBlocker(targetUserId),
      ]);

      if (userData.status === "fulfilled" && userData.value) {
        setTargetUser(userData.value);
        if (userData.value.isBlocked !== undefined) {
          setIsBlocked(Boolean(userData.value.isBlocked));
        }
      } else if (!userFromParam) {
        throw new Error("Failed to load user profile");
      }

      if (statsData.status === "fulfilled") {
        setStats(statsData.value);
      }

      // Check real-time follow status from backend endpoint
      if (followCheckData.status === "fulfilled") {
        setIsFollowing(Boolean(followCheckData.value?.isFollowing));
      } else if (userData.status === "fulfilled" && userData.value?.isFollowing !== undefined) {
        setIsFollowing(Boolean(userData.value.isFollowing));
      }

      // Check real-time block status from checkIsBlocker endpoint
      if (blockerCheckData.status === "fulfilled") {
        const value = blockerCheckData.value;
        const blockedStatus =
          typeof value === "boolean"
            ? value
            : Boolean(value?.isBlocked || value?.isBlocker);
        
        setIsBlocked(blockedStatus);
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      if (!userFromParam) setError(err.message || "Failed to load user.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, displayUser?.id, userFromParam]);

  const fetchUserPosts = useCallback(
    async (isRefresh = false, cursor?: string) => {
      const targetUserId = id || displayUser?.id;
      if (!targetUserId) return;

      try {
        if (!cursor && !isRefresh) setPostsLoading(true);

        const response = await postService.getUserPosts(targetUserId, {
          limit: 30,
          cursor: cursor || undefined,
        });

        const items = Array.isArray(response) ? response : response?.items || [];
        setNextCursor(response?.nextCursor || null);

        if (isRefresh || !cursor) {
          setPosts(items);
        } else {
          setPosts((prev) => [...prev, ...items]);
        }
      } catch (err) {
        console.error("Error loading user posts:", err);
      } finally {
        setPostsLoading(false);
        setLoadingMore(false);
      }
    },
    [id, displayUser?.id]
  );

  const handleLoadMorePosts = useCallback(() => {
    if (nextCursor && !loadingMore && !postsLoading) {
      setLoadingMore(true);
      fetchUserPosts(false, nextCursor);
    }
  }, [nextCursor, loadingMore, postsLoading, fetchUserPosts]);

  useEffect(() => {
    if (!userFromParam) {
      setLoading(true);
    }
    fetchUserData();
    fetchUserPosts();
  }, [fetchUserData, fetchUserPosts, userFromParam]);

  // Helper to adjust followers count dynamically
  const adjustFollowersCount = (isNowFollowing: boolean) => {
    setStats((prevStats) => {
      const currentCount = prevStats?.followersCount ?? 0;
      const updatedCount = isNowFollowing
        ? currentCount + 1
        : Math.max(0, currentCount - 1);

      return {
        ...prevStats,
        followersCount: updatedCount,
      };
    });
  };

  const handleFollowPress = async () => {
    const targetUserId = displayUser?.id || id;
    if (isFollowMutating || !targetUserId) return;
    setIsFollowMutating(true);

    const previousState = isFollowing;
    const nextState = !previousState;

    // Optimistic local state update
    setIsFollowing(nextState);
    adjustFollowersCount(nextState);

    // Broadcast to other components immediately
    DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
      userId: targetUserId,
      isFollowing: nextState,
    });

    try {
      if (previousState) {
        await userService.unfollowUser(targetUserId);
      } else {
        await userService.followUser(targetUserId);
      }
    } catch (error) {
      console.error("Failed to update follow status:", error);

      // Rollback local state & count
      setIsFollowing(previousState);
      adjustFollowersCount(previousState);

      DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
        userId: targetUserId,
        isFollowing: previousState,
      });

      showError("Could not update follow status", "Error");
    } finally {
      setIsFollowMutating(false);
    }
  };

  // Corrected Block / Unblock Action Handler
  const handleBlockToggle = () => {
    const targetUserId = displayUser?.id || id;
    if (!targetUserId || isBlockMutating) return;

    const actionText = isBlocked ? "unblock" : "block";

    Alert.alert(
      `${isBlocked ? "Unblock" : "Block"} @${displayUser?.username || "user"}?`,
      isBlocked
        ? "They will be able to see your posts and profile again."
        : "They will not be able to find your profile or see your posts.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isBlocked ? "Unblock" : "Block",
          style: isBlocked ? "default" : "destructive",
          onPress: async () => {
            setIsOptionsModalVisible(false);
            setIsBlockMutating(true);

            const prevBlocked = isBlocked;
            const prevFollowing = isFollowing;

            try {
              // Optimistic UI updates
              setIsBlocked(!prevBlocked);

              if (prevBlocked) {
                await userService.unblockUser(targetUserId);
                showSuccess(`Unblocked @${displayUser?.username}`);
              } else {
                await userService.blockUser(targetUserId);
                showSuccess(`Blocked @${displayUser?.username}`);

                // Automatically clear follow status when blocking
                if (prevFollowing) {
                  setIsFollowing(false);
                  adjustFollowersCount(false);

                  DeviceEventEmitter.emit("USER_FOLLOW_TOGGLED", {
                    userId: targetUserId,
                    isFollowing: false,
                  });
                }
              }
            } catch (err: any) {
              console.error(`Failed to ${actionText} user:`, err);

              // Rollback optimistic state changes
              setIsBlocked(prevBlocked);
              if (!prevBlocked && prevFollowing) {
                setIsFollowing(prevFollowing);
                adjustFollowersCount(prevFollowing);
              }

              showError(`Failed to ${actionText} user.`);
            } finally {
              setIsBlockMutating(false);
            }
          },
        },
      ]
    );
  };

  // Share Profile Action
  // const handleShareProfile = async () => {
  //   setIsOptionsModalVisible(false);
  //   try {
  //     const profileUrl = `https://campushub.app/profile/${displayUser?.id || id}`;
  //     const displayName =
  //       displayUser?.firstName && displayUser?.lastName
  //         ? `${displayUser.firstName} ${displayUser.lastName}`
  //         : displayUser?.username || "someone";

  //     const parts = [`Check out ${displayName}'s profile on Campus Hub!`];
  //     if (displayUser?.bio) parts.push(displayUser.bio);
  //     if (displayUser?.school?.name) parts.push(`🏫 ${displayUser.school.name}`);
  //     if (displayUser?.department?.name) parts.push(`📚 ${displayUser.department.name}`);
  //     parts.push(profileUrl);

  //     await Share.share({
  //       message: parts.join("\n"),
  //       url: profileUrl,
  //       title: `${displayName}'s Profile`,
  //     });
  //   } catch (error) {
  //     console.error("Error sharing profile:", error);
  //   }
  // };

  // Report User Action
  const handleReportUser = () => {
    setIsOptionsModalVisible(false);
    const targetUserId = displayUser?.id || id;
    if (!targetUserId) return;
    Alert.alert(
      "Report User",
      "Are you sure you want to report this user for violating community guidelines?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.reportUser(targetUserId, "Reported from profile — violates community guidelines");
              showSuccess("Report submitted. Thank you for keeping our community safe.");
            } catch (error) {
              console.error("Failed to report user:", error);
              showError("Could not submit report. Please try again.");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const targetUserId = displayUser?.id || id;
    if (!targetUserId) return;

    const subscription = DeviceEventEmitter.addListener(
      "USER_FOLLOW_TOGGLED",
      (event: { userId: string; isFollowing: boolean }) => {
        if (event.userId === targetUserId) {
          setIsFollowing((prevIsFollowing) => {
            if (prevIsFollowing !== event.isFollowing) {
              adjustFollowersCount(event.isFollowing);
            }
            return event.isFollowing;
          });
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [displayUser?.id, id]);

  // Real-time: when the profile owner updates their frame/picture/name,
  // patch the displayed user data immediately.
  useEffect(() => {
    const targetUserId = displayUser?.id || id;
    if (!targetUserId) return;

    const sub = DeviceEventEmitter.addListener(
      "PROFILE_FRAME_UPDATED",
      (data: { userId: string; profileFrame?: string | null; profilePictureUrl?: string | null; username?: string | null; firstName?: string | null; lastName?: string | null }) => {
        if (data.userId !== targetUserId) return;
        setLiveUserPatch((prev) => ({
          ...prev,
          ...(data.profileFrame !== undefined && { profileFrame: data.profileFrame }),
          ...(data.profilePictureUrl !== undefined && { profilePictureUrl: data.profilePictureUrl }),
          ...(data.username !== undefined && { username: data.username }),
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
        }));
      },
    );
    return () => sub.remove();
  }, [displayUser?.id, id]);

  if (loading && !displayUser) {
    return <UserProfileSkeleton onBack={() => router.back()} />;
  }

  if ((error || !displayUser) && !loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ThemedText style={styles.errorText}>
          {error || "User not found"}
        </ThemedText>
        <Pressable onPress={fetchUserData} style={styles.retryButton}>
          <ThemedText style={{ color: primaryAccent, fontWeight: "700" }}>
            Retry
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  // Private accounts: non-followers see a lock screen instead of profile content
  if (displayUser?.isPrivateProfile && !loading) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          translucent
          backgroundColor="transparent"
        />
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.iconButton,
              { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.privateProfileContainer}>
          <View
            style={[
              styles.privateProfileIcon,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="lock-closed" size={32} color={colors.muted} />
          </View>
          <ThemedText style={styles.privateProfileTitle}>
            This account is private
          </ThemedText>
          <ThemedText style={[styles.privateProfileSubtitle, { color: colors.muted }]}>
            Follow @{displayUser?.username || "this user"} to see their posts and profile.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          // Load the next page when the user scrolls near the bottom
          if (
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 400
          ) {
            handleLoadMorePosts();
          }
        }}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUserData();
              fetchUserPosts(true);
            }}
            tintColor={primaryAccent}
          />
        }
      >
        <ThemedView style={[styles.container,{}]}>
          {/* Header Action Bar */}
          <View style={[styles.topBar,{borderBottomWidth:1, borderColor:colors.border, paddingBottom:14}]}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.iconButton,
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
              ]}
            >
              <ArrowLeft size={20} color={colors.text} />
            </Pressable>

            {/* Ellipsis button opening Options Modal */}
            <Pressable
              onPress={() => setIsOptionsModalVisible(true)}
              style={styles.iconButton}
            >
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
            </Pressable>
          </View>

          {/* Hero Profile Section */}
          <ThemedView style={styles.heroSection}>
            <ThemedView style={styles.sideBySideRow}>
              {/* Avatar */}
              <ThemedView style={styles.avatarWrapper}>
                <Pressable onPress={() => setAvatarVisible(true)}>
                  <ProfileFrame
                    frameId={displayUser?.profileFrame}
                    uri={displayUser?.profilePictureUrl}
                    size={78}
                    initial={displayUser?.username?.[0]?.toUpperCase()}
                    fallbackColor={colors.card}
                  />
                </Pressable>
              </ThemedView>

              {/* User Main Details */}
              <ThemedView style={styles.infoColumn}>
                <ThemedView style={styles.nameRow}>
                  <ThemedText className="mb-2 mt-4" style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
                    {displayUser?.username || "username"}
                  </ThemedText>
                  {displayUser?.appLevel?.perks?.includes("Verified badge") && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color="#3B82F6"
                      style={{ marginLeft: 5, marginTop: 16 }}
                    />
                  )}
                </ThemedView>

                <LevelBadge level={displayUser?.appLevel} />

                {!!displayUser?.bio && (
                  <ThemedView style={styles.bioCard}>
                    <ThemedText style={[styles.bioText, { color: colors.text }]}>
                      {displayUser?.bio}
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>

            {/* School Chip */}
            {!!displayUser?.school?.name && (
              <ThemedView style={[styles.microChip, { borderColor: colors.border }]}>
                <School size={12} color={primaryAccent} />
                <ThemedText style={[styles.microChipText, { color: colors.text }]} numberOfLines={1}>
                  {displayUser?.school?.name}
                </ThemedText>
              </ThemedView>
            )}

            {/* Faculty & Department Chips */}
            {(!!displayUser?.faculty?.name || !!displayUser?.department?.name) && (
              <ThemedView style={styles.academicChipsContainer}>
                {!!displayUser?.faculty?.name && (
                  <ThemedView style={[styles.chip, { borderColor: colors.border }]}>
                    <GraduationCap size={13} color="#0284C7" />
                    <ThemedText style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                      {displayUser?.faculty?.name}
                    </ThemedText>
                  </ThemedView>
                )}

                {!!displayUser?.department?.name && (
                  <ThemedView style={[styles.chip, { borderColor: colors.border }]}>
                    <Library size={13} color="#16A34A" />
                    <ThemedText style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                      {displayUser?.department?.name}
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            )}
          </ThemedView>

          {/* Social Stats Strip */}
          <View style={[styles.statsRow, { borderColor: colors.border }]}>

             {/* Posts Stat */}
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.text }]}>
                {stats?.likesCount ?? 0}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.muted }]}>
                Likes
              </ThemedText>
            </View>
            {/* Posts Stat */}
            <View style={styles.statItem}>
              <ThemedText style={[styles.statNumber, { color: colors.text }]}>
                {stats?.postsCount ?? 0}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.muted }]}>
                Posts
              </ThemedText>
            </View>

            {/* Followers Stat */}
            <TouchableOpacity
              onPress={() => {
                if (!displayUser?.id) return;
                router.push({
                  pathname: "/followersFollowingScreen",
                  params: {
                    userId: displayUser.id,
                    initialTab: "followers",
                    username: displayUser.username,
                  },
                });
              }}
            >
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: colors.text }]}>
                  {stats?.followersCount ?? 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.muted }]}>
                  Followers
                </ThemedText>
              </View>
            </TouchableOpacity>

            {/* Following Stat */}
            <TouchableOpacity
              onPress={() => {
                if (!displayUser?.id) return;
                router.push({
                  pathname: "/followersFollowingScreen",
                  params: {
                    userId: displayUser.id,
                    initialTab: "following",
                    username: displayUser.username,
                  },
                });
              }}
            >
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: colors.text }]}>
                  {stats?.followingCount ?? 0}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.muted }]}>
                  Following
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons: Follow / Message */}
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={[
                styles.followButton,
                { backgroundColor: isFollowing ? colors.card : primaryAccent },
                isFollowing && { borderWidth: 1, borderColor: colors.border },
              ]}
              onPress={handleFollowPress}
            >
              {isFollowing ? (
                <>
                  <UserCheck size={16} color={colors.text} />
                  <ThemedText style={[styles.followButtonText, { color: colors.text }]}>
                    Following
                  </ThemedText>
                </>
              ) : (
                <>
                  <UserPlus size={16} color="#FFFFFF" />
                  <ThemedText style={[styles.followButtonText, { color: "#FFFFFF" }]}>
                    Follow
                  </ThemedText>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.messageButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => {
                if (displayUser?.id) {
                  router.push({
                    pathname: "/chatScreen",
                    params: {
                      id: displayUser?.id,
                      isUserId: "true",
                      user: JSON.stringify(displayUser),
                    },
                  });
                }
              }}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
              <ThemedText style={[styles.messageButtonText, { color: colors.text }]}>
                Message
              </ThemedText>
            </Pressable>
          </View>

          {/* Tab Selection Navigation */}
          <View style={[styles.tabsContainer, { borderColor: colors.border }]}>
            {(["posts"] as TabType[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabItem,
                  activeTab === tab && { borderBottomColor: primaryAccent },
                ]}
              >
                <ThemedText
                  style={[
                    styles.tabLabel,
                    {
                      color: activeTab === tab ? primaryAccent : colors.muted,
                      fontWeight: activeTab === tab ? "700" : "500",
                    },
                  ]}
                >
                  {tab.toUpperCase()}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Posts Grid */}
          <View style={styles.postsGridContainer}>
            {postsLoading ? (
              <PostGridSkeleton cellWidth={gridCellSize} rows={2} />
            ) : posts.length === 0 ? (
              <ThemedView style={styles.postsEmpty}>
                <Ionicons name="images-outline" size={32} color={colors.muted} />
                <ThemedText style={[styles.postsEmptyText, { color: colors.muted }]}>
                  No posts yet
                </ThemedText>
              </ThemedView>
            ) : (
              <View style={styles.postsGrid}>
                {posts.map((postItem) => {
                  const targetPost = postItem.post ?? postItem;
                  const mediaItem = targetPost.media?.[0];
                  const thumbnail = mediaItem?.url;

                  const isVideo =
                    mediaItem?.type === "video" ||
                    thumbnail?.endsWith(".mp4") ||
                    thumbnail?.endsWith(".mov") ||
                    thumbnail?.endsWith(".mkv") ||
                    thumbnail?.endsWith(".webM") ||
                    thumbnail?.endsWith(".avi");

                  const hasMedia = !!thumbnail;
                  const cellBg = hasMedia ? "#16161D" : (targetPost.backgroundColor || "#1C1C24");
                  const textCellBg = hasMedia ? "#1C1C24" : (targetPost.backgroundColor || "#1C1C24");

                  return (
                    <Pressable
                      key={targetPost.id}
                      onPress={() =>
                        router.push({
                          pathname: "/(features)/postDetailScreen",
                          params: { id: targetPost.id },
                        })
                      }
                      style={[
                        styles.postCell,
                        {
                          width: gridCellSize,
                          height: gridCellSize * 1.3,
                          backgroundColor: cellBg,
                        },
                      ]}
                    >
                      {thumbnail ? (
                        <>
                          <Image
                            source={{ uri: thumbnail }}
                            style={[styles.postThumbnail, isVideo && { resizeMode: "contain" }]}
                          />
                          {isVideo && (
                            <View style={styles.videoPlayOverlay}>
                              <View style={styles.videoPlayButton}>
                                <Ionicons name="play" size={16} color="#FFF" style={{ marginLeft: 2 }} />
                              </View>
                            </View>
                          )}
                        </>
                      ) : (
                        <ThemedView style={[styles.postTextCell, { backgroundColor: textCellBg }]}>
                          <ThemedText
                            numberOfLines={3}
                            style={[styles.postTextCellContent, { color: "#FFFFFF" }]}
                          >
                            {targetPost.description || "No Content"}
                          </ThemedText>
                        </ThemedView>
                      )}

                      <View style={styles.postLikesBadge}>
                        <Ionicons name="heart" size={12} color="#FFF" />
                        <Text style={styles.postLikesText}>
                          {targetPost.likesCount ?? 0}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Load more indicator */}
          {loadingMore ? (
            <View style={styles.postsLoader}>
              <ActivityIndicator color={primaryAccent} />
            </View>
          ) : null}
        </ThemedView>
      </ScrollView>

      {/* User Options Bottom Sheet Modal */}
      <Modal
        visible={isOptionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOptionsModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={(e) => e.stopPropagation()} // Prevent overlay close when tapping content
          >
            {/* Sheet Handle */}
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            {/* Sheet Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
                Options
              </ThemedText>
              <TouchableOpacity
                onPress={() => setIsOptionsModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Options Items */}
            <View style={styles.modalBody}>
              {/* Share Profile */}
              {/* <TouchableOpacity
                style={styles.modalOption}
                onPress={handleShareProfile}
              >
                <Share2 size={20} color={colors.text} />
                <ThemedText style={[styles.modalOptionText, { color: colors.text }]}>
                  Share Profile
                </ThemedText>
              </TouchableOpacity> */}

              {/* Report User */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleReportUser}
              >
                <ShieldAlert size={20} color="#EAB308" />
                <ThemedText style={[styles.modalOptionText, { color: colors.text }]}>
                  Report User
                </ThemedText>
              </TouchableOpacity>

              {/* Dynamic Block / Unblock User */}
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleBlockToggle}
                disabled={isBlockMutating}
              >
                {isBlocked ? (
                  <UserX size={20} color="#EF4444" />
                ) : (
                  <Ban size={20} color="#EF4444" />
                )}
                <ThemedText style={[styles.modalOptionText, { color: "#EF4444" }]}>
                  {isBlocked ? "Unblock User" : "Block User"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Full-screen profile picture viewer */}
      <ImageViewer
        visible={avatarVisible}
        imageUrl={displayUser?.profilePictureUrl}
        username={displayUser?.username}
        onClose={() => setAvatarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  privateProfileContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  privateProfileIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  privateProfileTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  privateProfileSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroSection: {
    paddingHorizontal: 16,
  },
  sideBySideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatarGradientRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInnerBorder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    padding: 2,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 39,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 39,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  infoColumn: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
  },
  bioCard: {
    marginTop: 8,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 18,
  },
  microChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 12,
    gap: 6,
  },
  microChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  academicChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    marginTop: 20,
    marginHorizontal: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  followButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontSize: 13,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  /* Posts Grid Styles */
  postsGridContainer: {
    marginTop: 4,
    paddingBottom: 40,
  },
  postsLoader: {
    paddingVertical: 40,
    alignItems: "center",
  },
  postsEmpty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  postsEmptyText: {
    fontSize: 14,
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  postCell: {
    backgroundColor: "#16161D",
    position: "relative",
    marginTop: 2,
  },
  postThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  postTextCell: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C1C24",
  },
  postTextCellContent: {
    fontSize: 11,
    color: "#CCC",
    textAlign: "center",
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  videoPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  postLikesBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  postLikesText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },

  /* Options Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    gap: 6,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 14,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});