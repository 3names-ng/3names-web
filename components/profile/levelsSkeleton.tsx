import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

/** Placeholder matching the levels screen hero card: badge, pill, title, XP and progress bar. */
function LevelHeroSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.hero, { borderColor: colors.border }]}>
      <Skeleton width={86} height={86} radius={20} style={styles.heroBadge} />
      <View style={styles.heroContent}>
        <Skeleton width={110} height={20} radius={10} />
        <Skeleton width="75%" height={20} radius={8} />
        <Skeleton width="45%" height={12} radius={6} />
        <Skeleton width="100%" height={6} radius={3} />
        <Skeleton width="85%" height={11} radius={6} />
      </View>
    </View>
  );
}

/** One placeholder matching a level timeline row: node, badge, title, XP range and status pill. */
function LevelRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.timelineColumn}>
        <SkeletonCircle size={20} />
      </View>
      <View style={[styles.card, { borderColor: colors.border }]}>
        <Skeleton width={56} height={56} radius={14} style={styles.badge} />
        <View style={styles.info}>
          <Skeleton width="65%" height={14} radius={7} />
          <Skeleton width="45%" height={11} radius={6} />
          <Skeleton width="55%" height={11} radius={6} />
        </View>
        <Skeleton width={62} height={22} radius={12} />
      </View>
    </View>
  );
}

/** Levels screen placeholders: hero card followed by timeline rows. */
export default function LevelsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading levels" style={styles.container}>
      <LevelHeroSkeleton />
      {Array.from({ length: count }).map((_, i) => (
        <LevelRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  hero: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  heroBadge: {
    marginRight: 12,
  },
  heroContent: {
    flex: 1,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timelineColumn: {
    width: 28,
    alignItems: "center",
    marginRight: 8,
  },
  card: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  badge: {
    marginRight: 10,
  },
  info: {
    flex: 1,
    gap: 6,
    paddingRight: 4,
  },
});
