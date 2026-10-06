import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

const OPPONENT_STAT_COUNT = 4;

/** One placeholder matching a battle history row: result badge, opponent, type/date, score. */
function BattleRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.battleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonCircle size={40} style={styles.resultBadge} />
      <View style={styles.battleInfo}>
        <View style={styles.opponentRow}>
          <SkeletonCircle size={28} />
          <Skeleton width="45%" height={15} radius={7} />
        </View>
        <Skeleton width="60%" height={12} radius={6} />
      </View>
      <Skeleton width={52} height={20} radius={10} />
    </View>
  );
}

/** Battle history placeholders. */
export function BattleHistorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading battle history" style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <BattleRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

/** One placeholder matching the full OpponentCard: avatar, name, challenge button, stats. */
function OpponentCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.opponentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.opponentHeader}>
        <SkeletonCircle size={56} />
        <View style={styles.opponentText}>
          <Skeleton width="60%" height={17} radius={8} />
          <Skeleton width="40%" height={13} radius={6} />
        </View>
        <Skeleton width={112} height={40} radius={20} />
      </View>
      <View style={[styles.stats, { borderTopColor: colors.border }]}>
        {Array.from({ length: OPPONENT_STAT_COUNT }).map((_, i) => (
          <View key={i} style={styles.statItem}>
            <Skeleton width={24} height={16} radius={8} />
            <Skeleton width={40} height={10} radius={5} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Opponent card placeholders for the quick match and search screens. */
export function OpponentListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Finding opponents" style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <OpponentCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
  },
  battleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  resultBadge: {
    marginRight: 14,
  },
  battleInfo: {
    flex: 1,
    gap: 8,
  },
  opponentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  opponentCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  opponentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  opponentText: {
    flex: 1,
    marginLeft: 14,
    gap: 6,
  },
  stats: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
});
