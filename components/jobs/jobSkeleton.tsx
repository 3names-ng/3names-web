import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton";

const SECTION_COUNT = 2;

/** Card background and border used by the jobs screens. */
function useJobCardColors() {
  const { isDark } = useTheme();
  return {
    backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
    borderColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)",
    dividerColor: isDark ? "rgba(148,163,184,0.08)" : "rgba(0,0,0,0.04)",
  };
}

/** One placeholder matching a job card: type badge, company logo and title, chips, footer. */
function JobCardSkeleton() {
  const { backgroundColor, borderColor, dividerColor } = useJobCardColors();

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      <View style={styles.topRow}>
        <Skeleton width={84} height={24} radius={8} />
        <Skeleton width={50} height={10} radius={5} />
      </View>

      <View style={styles.contentRow}>
        <Skeleton width={52} height={52} radius={14} />
        <View style={styles.info}>
          <Skeleton width="75%" height={17} radius={8} />
          <Skeleton width="45%" height={13} radius={6} />
        </View>
        <Skeleton width={36} height={36} radius={10} />
      </View>

      <View style={styles.chips}>
        <Skeleton width={96} height={26} radius={10} />
        <Skeleton width={76} height={26} radius={10} />
      </View>

      <View style={[styles.footer, { borderTopColor: dividerColor }]}>
        <Skeleton width={96} height={12} radius={6} />
        <Skeleton width={96} height={24} radius={8} />
      </View>
    </View>
  );
}

/** Stacked job card placeholders for the jobs list's first load. */
export function JobListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading jobs" style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

/**
 * Body placeholder for the job detail page (render it under the real header):
 * centred company logo, title and type badge, info chips, then section cards.
 */
export function JobDetailSkeleton() {
  const { backgroundColor, borderColor } = useJobCardColors();

  return (
    <SkeletonGroup label="Loading job details">
      <View style={styles.hero}>
        <Skeleton width={80} height={80} radius={22} />
        <Skeleton width="65%" height={24} radius={12} />
        <Skeleton width="35%" height={16} radius={8} />
        <Skeleton width={120} height={32} radius={12} style={styles.badge} />
      </View>

      <View style={styles.quickInfo}>
        <Skeleton width={96} height={34} radius={12} />
        <Skeleton width={84} height={34} radius={12} />
        <Skeleton width={110} height={34} radius={12} />
      </View>

      <View style={styles.sections}>
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <View key={i} style={[styles.sectionCard, { backgroundColor, borderColor }]}>
            <View style={styles.sectionHeader}>
              <Skeleton width={36} height={36} radius={10} />
              <Skeleton width={120} height={17} radius={8} />
            </View>
            <SkeletonText lines={4} lineHeight={12} lastLineWidth="60%" />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  info: {
    flex: 1,
    marginLeft: 14,
    gap: 6,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
  },
  hero: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  badge: {
    marginTop: 4,
  },
  quickInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  sections: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
});
