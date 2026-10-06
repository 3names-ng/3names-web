import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// Keep in sync with FEED_TAB_OFFSET in feedCard.tsx
const FEED_TAB_OFFSET = 60;
const ACTION_COUNT = 5;

/**
 * Full-screen placeholder that mirrors FeedCard: dark card, user header and
 * caption at the bottom-left, action rail on the right.
 */
export default function FeedCardSkeleton() {
  const insets = useSafeAreaInsets();
  const bottom = insets.bottom + FEED_TAB_OFFSET;

  return (
    <SkeletonGroup label="Loading your feed" style={styles.card}>
      <View style={[styles.bottomOverlay, { paddingBottom: bottom }]}>
        <View style={styles.headerRow}>
          <SkeletonCircle size={44} tone="onDark" />
          <View style={styles.headerText}>
            <Skeleton width={110} height={14} radius={7} tone="onDark" />
            <Skeleton width={50} height={14} radius={7} tone="onDark" />
            <Skeleton width={40} height={10} radius={5} tone="onDark" />
          </View>
        </View>
        <SkeletonText
          lines={2}
          lineHeight={13}
          width="85%"
          lastLineWidth="55%"
          tone="onDark"
          style={styles.caption}
        />
        <Skeleton width="40%" height={12} radius={6} tone="onDark" />
      </View>

      <View style={[styles.actionRail, { bottom }]}>
        {Array.from({ length: ACTION_COUNT }).map((_, i) => (
          <View key={i} style={styles.actionItem}>
            <SkeletonCircle size={28} tone="onDark" />
            <Skeleton width={20} height={10} radius={5} tone="onDark" />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#0e0e14",
    overflow: "hidden",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    marginRight: 60,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 10,
    gap: 5,
  },
  caption: {
    marginTop: 12,
    marginBottom: 8,
  },
  actionRail: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingRight: 12,
    justifyContent: "center",
    gap: 20,
  },
  actionItem: {
    alignItems: "center",
    gap: 4,
  },
});
