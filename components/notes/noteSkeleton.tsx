import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton";

/** One placeholder matching a note card: category + actions, title, preview and footer. */
function NoteCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Skeleton width={70} height={12} radius={6} />
        <View style={styles.actions}>
          <Skeleton width={18} height={18} radius={4} />
          <Skeleton width={18} height={18} radius={4} />
        </View>
      </View>
      <Skeleton width="70%" height={16} radius={8} />
      <SkeletonText lines={2} lineHeight={12} style={styles.preview} />
      <Skeleton width={90} height={11} radius={6} />
    </View>
  );
}

/** Notes screen placeholders: banner, search bar, category tabs and note cards. */
export default function NoteSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading notes">
      <View style={styles.banner}>
        <Skeleton width="100%" height={140} radius={20} />
      </View>
      <View style={styles.search}>
        <Skeleton width="100%" height={44} radius={12} />
      </View>
      <View style={styles.tabs}>
        {[80, 90, 70, 80].map((w, i) => (
          <Skeleton key={i} width={w} height={32} radius={16} />
        ))}
      </View>
      <View style={styles.list}>
        {Array.from({ length: count }).map((_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  search: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  preview: {
    marginVertical: 2,
  },
});
