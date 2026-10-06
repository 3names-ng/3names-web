import React from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

/** One placeholder row matching ChatItem's card. */
function ChatItemSkeletonRow() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SkeletonCircle size={52} />
        <View style={styles.content}>
          <Skeleton width="50%" height={16} radius={8} />
          <Skeleton width="80%" height={12} radius={6} />
        </View>
        <View style={styles.right}>
          <Skeleton width={36} height={10} radius={5} />
          <SkeletonCircle size={18} />
        </View>
      </View>
    </View>
  );
}

/** A list of chat row placeholders for the chat list's first load. */
export default function ChatListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading conversations">
      {Array.from({ length: count }).map((_, i) => (
        <ChatItemSkeletonRow key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  container: {
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
    gap: 10,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 60,
    paddingVertical: 6,
  },
});
