import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

/** One placeholder matching a Coin Battle opponent row: avatar, name, Stars balance, Challenge pill. */
function OnlinePlayerRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.playerRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonCircle size={44} />
      <View style={styles.playerText}>
        <Skeleton width="50%" height={15} radius={7} />
        <Skeleton width="35%" height={12} radius={6} />
      </View>
      <Skeleton width={100} height={34} radius={17} />
    </View>
  );
}

/** Online player placeholders for the Coin Battle opponent picker. */
export function OnlinePlayersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonGroup label="Finding online players">
      {Array.from({ length: count }).map((_, i) => (
        <OnlinePlayerRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

/** One placeholder matching a Treasure Hunt "Recent Finds" card: avatar, name, reward, time. */
function RecentClaimSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.claimCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonCircle size={40} style={styles.claimAvatar} />
      <View style={styles.claimInfo}>
        <Skeleton width="45%" height={14} radius={7} />
        <Skeleton width="65%" height={12} radius={6} />
      </View>
      <View style={styles.claimRight}>
        <Skeleton width={44} height={20} radius={10} />
        <Skeleton width={36} height={10} radius={5} />
      </View>
    </View>
  );
}

/** Recent find placeholders for the Treasure Hunt screen. */
export function RecentClaimsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading recent finds" style={styles.claimList}>
      {Array.from({ length: count }).map((_, i) => (
        <RecentClaimSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

/** One placeholder matching a 2048 "Top Scores" row: rank, avatar, name and level, score. */
function ScoreRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.scoreRow, { borderBottomColor: colors.border }]}>
      <Skeleton width={24} height={14} radius={7} />
      <SkeletonCircle size={36} />
      <View style={styles.scoreUser}>
        <Skeleton width="55%" height={14} radius={7} />
        <Skeleton width={56} height={14} radius={7} />
      </View>
      <Skeleton width={48} height={16} radius={8} />
    </View>
  );
}

/** Top score placeholders for the 2048 leaderboard sheet. */
export function ScoreListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading top scores">
      {Array.from({ length: count }).map((_, i) => (
        <ScoreRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  playerText: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  claimList: {
    gap: 10,
  },
  claimCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  claimAvatar: {
    marginRight: 12,
  },
  claimInfo: {
    flex: 1,
    gap: 6,
  },
  claimRight: {
    alignItems: "flex-end",
    marginLeft: 8,
    gap: 6,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  scoreUser: {
    flex: 1,
    gap: 4,
  },
});
