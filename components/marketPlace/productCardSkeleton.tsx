import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

/** One placeholder matching the marketplace product card: photo, title, price, time. */
function ProductCardSkeleton() {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#27272A" : "#FFFFFF",
          borderColor: isDark ? "#3F3F46" : "#E5E7EB",
        },
      ]}
    >
      <Skeleton width="100%" height={130} radius={0} />
      <View style={styles.details}>
        <Skeleton width="80%" height={13} radius={6} />
        <View style={styles.priceRow}>
          <Skeleton width={64} height={14} radius={7} />
          <Skeleton width={40} height={14} radius={6} />
        </View>
        <Skeleton width={44} height={10} radius={5} />
      </View>
    </View>
  );
}

/** Two-column grid of product placeholders for the marketplace's first load. */
export default function MarketplaceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading listings" style={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48.5%",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  details: {
    padding: 10,
    gap: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
