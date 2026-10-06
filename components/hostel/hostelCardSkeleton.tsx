import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/** One placeholder matching HostelCard: photo on the left, details on the right. */
function HostelCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton width={145} height={170} radius={0} />
        <View style={styles.body}>
          <View style={styles.top}>
            <Skeleton width="85%" height={20} radius={10} />
            <Skeleton width="70%" height={13} radius={6} />
            <Skeleton width="45%" height={13} radius={6} />
          </View>
          <Skeleton width="55%" height={20} radius={10} />
        </View>
      </View>
    </View>
  );
}

/** Stacked hostel card placeholders for the hostel list's first load. */
export default function HostelListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading hostels">
      {Array.from({ length: count }).map((_, i) => (
        <HostelCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  card: {
    flexDirection: "row",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  body: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  top: {
    gap: 10,
  },
});
