import React from "react";
import { Image, Pressable, View, StyleSheet } from "react-native";
import { Star, GraduationCap, Building2, BookOpen } from "lucide-react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useAuthStore } from "@/store/authStore";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { LevelBadge } from "@/components/levelBadge";

export type TrendingUser = {
  id: string;
  name?: string;
  username: string;
  avatar: string;
  school?: string;
  faculty?: string;
  department?: string;
  bio?: string;
  verified?: boolean;
  isFollowing?: boolean;
  isCurrentUser?: boolean;
  rank?: number;
  profileFrame?: string | null;
  appLevel?: any | null;
};

interface Props {
  user: TrendingUser;
  onPress?: () => void;
  onFollow?: () => void;
  onFollowToggle?: () => void;
}

export default function RecentUserCard({
  user,
  onPress,
  onFollow,
  onFollowToggle,
}: Props) {
  const handleFollow = onFollowToggle ?? onFollow;
  const currentUser = useAuthStore((state) => state.user);

  // Check if this card represents the currently authenticated user
  const isSelf = user.isCurrentUser || (currentUser?.id && user.id === currentUser.id);

  return (
    <Pressable onPress={onPress} style={styles.cardWrapper}>
      <ThemedView style={styles.container}>
        {/* Main Info Area */}
        <View style={styles.mainInfo}>
          {/* Top Row: Avatar + Name & Username */}
          <View style={styles.headerRow}>
            <ProfileFrame
              frameId={user.profileFrame}
              uri={user.avatar}
              size={48}
              initial={user.username?.[0]?.toUpperCase()}
            />

            <View style={styles.nameContainer}>
              <View style={styles.displayNameRow}>
                <ThemedText style={styles.displayName} numberOfLines={1}>
                  {user.username}
                </ThemedText>
                {user.verified && (
                  <Star size={16} color="#8B5CF6" fill="#8B5CF6" style={styles.starIcon} />
                )}
              </View>
              {user.appLevel && (
                <View style={{ marginTop: 2 }}>
                  <LevelBadge level={user.appLevel} />
                </View>
              )}
            </View>
          </View>

          {/* Bottom Area: School, Faculty, and Department stacked under */}
          <View style={styles.academicContainer}>
            {user.school ? (
              <View style={styles.metaRow}>
                <GraduationCap size={14} color="#6B7280" style={styles.metaIcon} />
                <ThemedText style={styles.metaText} numberOfLines={1}>
                  {user.school}
                </ThemedText>
              </View>
            ) : null}

            {user.faculty ? (
              <View style={styles.metaRow}>
                <Building2 size={14} color="#6B7280" style={styles.metaIcon} />
                <ThemedText style={styles.metaText} numberOfLines={1}>
                  {user.faculty}
                </ThemedText>
              </View>
            ) : null}

            {user.department ? (
              <View style={styles.metaRow}>
                <BookOpen size={14} color="#6B7280" style={styles.metaIcon} />
                <ThemedText style={styles.metaText} numberOfLines={1}>
                  {user.department}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

    
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginVertical: 4,
  },
  container: {
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.16)",
  },
  mainInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  displayNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  displayName: {
    fontSize: 16,
    fontWeight: "700",
  },
  starIcon: {
    marginLeft: 6,
  },
  usernameText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 1,
  },
  academicContainer: {
    marginTop: 10,
    gap: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  followBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  followBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
});