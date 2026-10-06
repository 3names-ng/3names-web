import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

/** Card surface shared by QuestionCard and ContributorCard (bg-white / dark:bg-neutral-900). */
function useCardStyle() {
  const { colors, isDark } = useTheme();
  return {
    backgroundColor: isDark ? "#171717" : "#FFFFFF",
    borderColor: colors.border,
  };
}

/** One placeholder matching QuestionCard: document icon tile, course details, action pill. */
function QuestionCardSkeleton() {
  const cardStyle = useCardStyle();

  return (
    <View style={[styles.card, cardStyle]}>
      <View style={styles.row}>
        <Skeleton width={64} height={64} radius={16} />
        <View style={styles.details}>
          <Skeleton width="45%" height={18} radius={9} />
          <Skeleton width="75%" height={14} radius={7} />
          <Skeleton width="40%" height={12} radius={6} />
          <Skeleton width={80} height={12} radius={6} />
        </View>
        <Skeleton width={52} height={34} radius={17} />
      </View>
    </View>
  );
}

/** Past question card placeholders for the department list's first load. */
export function QuestionListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading past questions">
      {Array.from({ length: count }).map((_, i) => (
        <QuestionCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

/** One placeholder matching ContributorCard: rank, avatar, name, uploads and follow button. */
function ContributorCardSkeleton() {
  const cardStyle = useCardStyle();

  return (
    <View style={[styles.card, cardStyle]}>
      <View style={styles.row}>
        <SkeletonCircle size={28} style={styles.rank} />
        <SkeletonCircle size={42} />
        <View style={styles.details}>
          <Skeleton width="50%" height={18} radius={9} />
          <Skeleton width={60} height={16} radius={8} />
        </View>
      </View>
      <View style={styles.stats}>
        <View style={styles.uploads}>
          <Skeleton width={28} height={20} radius={10} />
          <Skeleton width={52} height={12} radius={6} />
        </View>
        <Skeleton width={120} height={48} radius={16} />
      </View>
    </View>
  );
}

/** Top contributor placeholders. */
export function ContributorListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading contributors">
      {Array.from({ length: count }).map((_, i) => (
        <ContributorCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  details: {
    flex: 1,
    marginLeft: 16,
    gap: 8,
  },
  rank: {
    marginRight: 12,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  uploads: {
    alignItems: "center",
    gap: 6,
  },
});
