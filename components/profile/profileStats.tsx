import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Profile } from "@/types/profile";
import { ThemedText } from "../ui/ThemedText";
import { formatCount } from "@/service/helper";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  profile?: Profile | null;
  // Optional override stats object directly from backend API
  stats?: {
    postsCount?: number;
    followersCount?: number;
    followingCount?: number;
    likesCount?: number;
    giftsCount?: number;
  };
  onPostsPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onLikesPress?: () => void;
  onGiftsPress?: () => void;
}

function StatItem({
  value = 0,
  label,
  onPress,
}: {
  value?: number;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.item} onPress={onPress}>
      <ThemedText style={styles.value}>{formatCount(value)}</ThemedText>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </Pressable>
  );
}

export default function ProfileStats({
  profile,
  stats,
  onPostsPress,
  onFollowersPress,
  onFollowingPress,
  onLikesPress,
  onGiftsPress,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  // Gracefully fallback to stats prop or profile object values
  const posts = stats?.postsCount ?? 0;
  const followers = stats?.followersCount ?? 0;
  const following = stats?.followingCount ?? 0;
  const likes = stats?.likesCount ?? 0;
  const gifts = stats?.giftsCount ?? 0;

  return (
    <ThemedView
      style={{
        marginHorizontal: 18,
        marginTop: 22,
        backgroundColor: colors.background,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 18,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <StatItem value={posts} label={t("profile.posts")} onPress={onPostsPress} />

      <ThemedView
        style={{ width: 1, height: 34, backgroundColor: colors.border }}
      />

      <StatItem
        value={followers}
        label={t("profile.followers")}
        onPress={onFollowersPress}
      />

      <ThemedView
        style={{ width: 1, height: 34, backgroundColor: colors.border }}
      />

      <StatItem
        value={following}
        label={t("profile.following")}
        onPress={onFollowingPress}
      />

      <ThemedView
        style={{ width: 1, height: 34, backgroundColor: colors.border }}
      />

      <StatItem value={likes} label={t("profile.likes")} onPress={onLikesPress} />

      <ThemedView
        style={{ width: 1, height: 34, backgroundColor: colors.border }}
      />

      <StatItem value={gifts} label={t("profile.gifts")} onPress={onGiftsPress} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {},
  item: {
    flex: 1,
    alignItems: "center",
  },
  divider: {},
  value: {
    // color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    // color: "#A1A1AA",
    marginTop: 6,
    fontSize: 12,
  },
});
