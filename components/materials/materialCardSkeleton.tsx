import React from "react";
import { StyleSheet, View } from "react-native";

import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton";

/** One placeholder matching a MaterialListScreen card: badge, title, description, meta, footer. */
function MaterialCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Skeleton width={64} height={18} radius={6} />
        <Skeleton width={32} height={10} radius={5} />
      </View>
      <Skeleton width="80%" height={16} radius={8} />
      <SkeletonText lines={2} lineHeight={12} lastLineWidth="60%" style={styles.description} />
      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <SkeletonCircle size={14} />
          <Skeleton width={72} height={10} radius={5} />
        </View>
        <View style={styles.metaItem}>
          <SkeletonCircle size={14} />
          <Skeleton width={56} height={10} radius={5} />
        </View>
      </View>
      <View style={styles.footer}>
        <Skeleton width={84} height={12} radius={6} />
        <Skeleton width={52} height={22} radius={8} />
      </View>
    </View>
  );
}

/** Material card placeholders for a materials category's first load. */
export default function MaterialListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading materials">
      {Array.from({ length: count }).map((_, i) => (
        <MaterialCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  // Matches MaterialListScreen's card, which is white in both themes
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  description: {
    marginBottom: 2,
  },
  meta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 10,
  },
});
