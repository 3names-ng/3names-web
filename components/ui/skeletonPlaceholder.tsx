import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A single animated skeleton bar. Kept as an alias of the shared `Skeleton`
 * so existing screens pulse in sync with the rest of the app.
 */
export const SkeletonBar = Skeleton;

/**
 * A complete skeleton that mirrors the TopicCard layout.
 */
export function TopicCardSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Header: icon + title */}
      <View style={styles.cardHeader}>
        <SkeletonBar width={40} height={40} radius={12} />
        <View style={styles.cardTitleWrap}>
          <SkeletonBar width="90%" height={14} radius={6} />
          <View style={{ height: 6 }} />
          <SkeletonBar width="50%" height={12} radius={6} />
        </View>
      </View>

      {/* Description lines */}
      <View style={{ marginTop: 14 }}>
        <SkeletonBar width="100%" height={12} radius={6} />
        <View style={{ height: 6 }} />
        <SkeletonBar width="100%" height={12} radius={6} />
        <View style={{ height: 6 }} />
        <SkeletonBar width="70%" height={12} radius={6} />
      </View>

      {/* Tags */}
      <View style={styles.skeletonTags}>
        <SkeletonBar width={60} height={24} radius={12} />
        <SkeletonBar width={80} height={24} radius={12} />
        <SkeletonBar width={50} height={24} radius={12} />
      </View>

      {/* Footer stats */}
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <SkeletonBar width={40} height={12} radius={6} />
        <SkeletonBar width={35} height={12} radius={6} />
        <SkeletonBar width={80} height={12} radius={6} />
      </View>
    </View>
  );
}

/**
 * Renders N skeleton cards to mimic the loading list.
 */
export function ProjectTopicsSkeleton({ count = 5 }: { count?: number }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Search bar skeleton */}
      <SkeletonBar width="100%" height={44} radius={14} style={{ marginBottom: 12 }} />

      {/* Chip skeletons */}
      <View style={styles.chipSkeletonRow}>
        <SkeletonBar width={70} height={12} radius={6} />
      </View>
      <View style={styles.chipSkeletonRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBar key={i} width={60 + i * 6} height={30} radius={16} />
        ))}
      </View>

      <View style={{ height: 10 }} />

      {/* Card skeletons */}
      {Array.from({ length: count }).map((_, i) => (
        <TopicCardSkeleton key={i} colors={colors} />
      ))}
    </View>
  );
}

/**
 * Skeleton for the detail screen layout.
 */
export function TopicDetailSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={detailStyles.container}>
      {/* Title card */}
      <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={detailStyles.titleRow}>
          <SkeletonBar width={44} height={44} radius={12} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <SkeletonBar width="90%" height={18} radius={6} />
            <View style={{ height: 6 }} />
            <SkeletonBar width="60%" height={14} radius={6} />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <SkeletonBar width={80} height={26} radius={8} />
          <SkeletonBar width={100} height={26} radius={8} />
          <SkeletonBar width={70} height={26} radius={8} />
        </View>
      </View>

      {/* Description card */}
      <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBar width={80} height={12} radius={6} />
        <View style={{ height: 12 }} />
        <SkeletonBar width="100%" height={14} radius={6} />
        <View style={{ height: 6 }} />
        <SkeletonBar width="100%" height={14} radius={6} />
        <View style={{ height: 6 }} />
        <SkeletonBar width="80%" height={14} radius={6} />
        <View style={{ height: 6 }} />
        <SkeletonBar width="60%" height={14} radius={6} />
      </View>

      {/* Tags card */}
      <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBar width={40} height={12} radius={6} />
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <SkeletonBar width={70} height={28} radius={14} />
          <SkeletonBar width={90} height={28} radius={14} />
          <SkeletonBar width={55} height={28} radius={14} />
        </View>
      </View>

      {/* Author card */}
      <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBar width={80} height={12} radius={6} />
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <SkeletonBar width={44} height={44} radius={22} />
          <View>
            <SkeletonBar width={120} height={14} radius={6} />
            <View style={{ height: 6 }} />
            <SkeletonBar width={80} height={12} radius={6} />
          </View>
        </View>
      </View>

      {/* Stats card */}
      <View style={[detailStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonBar width={40} height={12} radius={6} />
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center", gap: 4 }}>
            <SkeletonBar width={24} height={24} radius={12} />
            <SkeletonBar width={30} height={18} radius={6} />
            <SkeletonBar width={45} height={10} radius={5} />
          </View>
          <View style={{ alignItems: "center", gap: 4 }}>
            <SkeletonBar width={24} height={24} radius={12} />
            <SkeletonBar width={30} height={18} radius={6} />
            <SkeletonBar width={55} height={10} radius={5} />
          </View>
          <View style={{ alignItems: "center", gap: 4 }}>
            <SkeletonBar width={24} height={24} radius={12} />
            <SkeletonBar width={30} height={18} radius={6} />
            <SkeletonBar width={35} height={10} radius={5} />
          </View>
        </View>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonTags: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
  },
  chipSkeletonRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
});
