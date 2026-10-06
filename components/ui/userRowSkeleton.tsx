import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

/** One placeholder user row: avatar, one to three text lines, action button. */
function UserRowSkeleton({ lines }: { lines: number }) {
  const { colors } = useTheme();
  const widths = ["55%", "35%", "45%"] as const;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <SkeletonCircle size={48} style={styles.avatar} />
      <View style={styles.info}>
        {widths.slice(0, lines).map((width, i) => (
          <Skeleton key={i} width={width} height={i === 0 ? 15 : 12} radius={6} />
        ))}
      </View>
      <Skeleton width={95} height={34} radius={17} />
    </View>
  );
}

/**
 * List of user row placeholders, shared by the followers/following and
 * blocked users screens (same card: 48pt avatar, text, 95pt pill button).
 */
export default function UserListSkeleton({
  count = 7,
  lines = 2,
  label = "Loading people",
}: {
  count?: number;
  lines?: number;
  label?: string;
}) {
  return (
    <SkeletonGroup label={label} style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <UserRowSkeleton key={i} lines={lines} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
    gap: 6,
  },
});
