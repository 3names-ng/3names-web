import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton";

/** One placeholder matching NotificationCard: rounded icon, title, message, time. */
function NotificationCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={styles.cardWrap}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Skeleton width={54} height={54} radius={18} />
        <View style={styles.content}>
          <Skeleton width="60%" height={16} radius={8} />
          <SkeletonText lines={2} lineHeight={12} lastLineWidth="75%" />
          <Skeleton width={50} height={10} radius={5} />
        </View>
      </View>
    </View>
  );
}

/** Placeholder for the notifications list: a section header and a few cards. */
export default function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading notifications" style={styles.container}>
      <View style={styles.sectionHeader}>
        <Skeleton width={90} height={20} radius={10} />
        <Skeleton width={34} height={24} radius={12} />
      </View>
      {Array.from({ length: count }).map((_, i) => (
        <NotificationCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  cardWrap: {
    marginHorizontal: 20,
    marginBottom: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    gap: 8,
  },
});
