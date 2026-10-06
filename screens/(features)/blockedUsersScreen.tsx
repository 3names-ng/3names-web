import React, { useState, useCallback } from "react";
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, ShieldOff } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import { userService, BlockedUserItem } from "@/service/profile.Service";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { showError, showSuccess } from "@/components/ui/toast";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { useDelayedLoading } from "@/components/ui/skeleton";
import UserListSkeleton from "@/components/ui/userRowSkeleton";

export default function BlockedUsersScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const primaryAccent = colors.primary || "#7C3AED";

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const showSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [unblockingIds, setUnblockingIds] = useState<Record<string, boolean>>({});

  const fetchBlockedUsers = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await userService.getBlockedUsers();
      setBlockedUsers(res || []);
    } catch (err: any) {
      console.error("Failed to load blocked users:", err);
      showError("Could not load blocked users", "Error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchBlockedUsers();
    }, [fetchBlockedUsers])
  );

  // Safely extract the inner user object or fallback to root
  const getUserData = (item: any) => item?.user ?? item;

  const getDisplayName = (item: any) => {
    const user = getUserData(item);
    const fullName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return fullName || user?.username || "Unknown User";
  };

  const handleUnblock = (item: any) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${getDisplayName(item)}? They will be able to see your profile and contact you again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: () => performUnblock(item),
        },
      ]
    );
  };

  const performUnblock = async (item: any) => {
    const user = getUserData(item);
    const userId = user?.id || user?._id || item.blockId;
    if (!userId || unblockingIds[userId]) return;

    setUnblockingIds((prev) => ({ ...prev, [userId]: true }));

    try {
      await userService.unblockUser(userId);
      setBlockedUsers((prev) =>
        prev.filter((u) => {
          const target = getUserData(u);
          return (target?.id || target?._id || u.blockId) !== userId;
        })
      );
      showSuccess(`${getDisplayName(item)} has been unblocked`);
    } catch (err: any) {
      console.error("Failed to unblock user:", err);
      showError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not unblock this user",
        "Error"
      );
    } finally {
      setUnblockingIds((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBlockedUsers(true);
  };

  const renderUserCard = ({ item, index }: { item: any; index: number }) => {
    const user = getUserData(item);
    const userId = user?.id || user?._id || item.blockId;
    const isUnblocking = userId ? unblockingIds[userId] : false;

    return (
      <ThemedView
        style={[
          styles.userCard,
          { borderColor: colors.border },
        ]}
      >
        <View style={styles.avatarContainer}>
          <ProfileFrame
            frameId={user?.profileFrame}
            uri={user?.profilePictureUrl}
            size={48}
            initial={user?.username?.[0]?.toUpperCase()}
            fallbackColor={colors.primaryLight}
          />
        </View>

        <View style={styles.userInfo}>
          <ThemedText style={styles.nameText} numberOfLines={1}>
            {getDisplayName(item)}
          </ThemedText>
          {user?.username ? (
            <ThemedText style={[styles.usernameText, { color: colors.muted }]} numberOfLines={1}>
              @{user.username}
            </ThemedText>
          ) : null}
          {item.blockedAt ? (
            <ThemedText style={[styles.blockedDateText, { color: colors.muted }]}>
              Blocked {formatDate(item.blockedAt)}
            </ThemedText>
          ) : null}
        </View>

        <Pressable
          style={[styles.unblockButton, { borderColor: colors.border }]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={primaryAccent} />
          ) : (
            <>
              <ShieldOff size={14} color={primaryAccent} />
              <ThemedText style={[styles.unblockButtonText, { color: primaryAccent }]}>
                Unblock
              </ThemedText>
            </>
          )}
        </Pressable>
      </ThemedView>
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
          Blocked Users
        </ThemedText>
        <View style={styles.placeholderIconButton} />
      </View>

      {loading ? (
        showSkeleton ? <UserListSkeleton lines={3} label="Loading blocked users" /> : null
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item, index) => {
            const user = getUserData(item);
            const key = item.blockId || user?.id || user?._id || user?.username;
            return key ? String(key) : `blocked-user-${index}`;
          }}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={primaryAccent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primaryLight }]}>
                <ShieldOff size={32} color={primaryAccent} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                No blocked users
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: colors.muted }]}>
                When you block someone, they'll show up here so you can manage them.
              </ThemedText>
            </View>
          }
        />
      )}
    </View>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
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
    marginRight: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  usernameText: {
    fontSize: 13,
    marginBottom: 2,
  },
  blockedDateText: {
    fontSize: 12,
  },
  unblockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    minWidth: 95,
  },
  unblockButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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