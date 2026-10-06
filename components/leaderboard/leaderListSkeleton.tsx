import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

/** One placeholder matching LeaderCard: rank, avatar, name and level badge. */
function LeaderRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rank}>
        <Skeleton width={26} height={22} radius={6} />
      </View>
      <SkeletonCircle size={56} style={styles.avatar} />
      <View style={styles.details}>
        <Skeleton width="55%" height={17} radius={8} />
        <Skeleton width={64} height={16} radius={8} />
      </View>
    </View>
  );
}

/** Leaderboard row placeholders. */
export default function LeaderListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading leaderboard">
      {Array.from({ length: count }).map((_, i) => (
        <LeaderRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  rank: {
    width: 40,
    alignItems: "center",
  },
  avatar: {
    marginLeft: 10,
  },
  details: {
    flex: 1,
    marginLeft: 15,
    gap: 6,
  },
});
