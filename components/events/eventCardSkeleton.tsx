import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton";

/** One placeholder matching an event card: cover image left, title, description, date and place. */
function EventCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <Skeleton width={100} height={100} radius={12} />
      <View style={styles.content}>
        <Skeleton width="75%" height={15} radius={7} />
        <SkeletonText lines={2} lineHeight={11} lastLineWidth="65%" />
        <View style={styles.metaRow}>
          <SkeletonCircle size={14} />
          <Skeleton width="50%" height={10} radius={5} />
        </View>
        <View style={styles.metaRow}>
          <SkeletonCircle size={14} />
          <Skeleton width="40%" height={10} radius={5} />
        </View>
      </View>
    </View>
  );
}

/** Stacked event card placeholders for the events list's first load. */
export default function EventListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading events">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
