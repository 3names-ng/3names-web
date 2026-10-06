import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";

import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

const AVATAR_SIZE = 72;
const ITEM_SPACING = 16; // matches the stories row's mr-4
const ROW_PADDING = 16;

/** Placeholder for the horizontal stories row: avatar circles with a name bar. */
export default function StoriesSkeleton() {
  const { width } = useWindowDimensions();
  // Enough items to fill the row, plus one peeking in at the edge
  const count = Math.ceil((width - ROW_PADDING) / (AVATAR_SIZE + ITEM_SPACING));

  return (
    <SkeletonGroup label="Loading stories" style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.item}>
          <SkeletonCircle size={AVATAR_SIZE} />
          <Skeleton width={56} height={10} radius={5} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    overflow: "hidden",
    paddingHorizontal: ROW_PADDING,
    paddingVertical: 10,
  },
  item: {
    alignItems: "center",
    marginRight: ITEM_SPACING,
    gap: 8,
  },
});
