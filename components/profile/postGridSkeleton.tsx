import React from "react";
import { StyleSheet, View } from "react-native";

import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

interface Props {
  /** Width of one grid cell; cells are 1.3x as tall, like the real grid. */
  cellWidth: number;
  /** Horizontal margin on each side of a cell. */
  cellMargin?: number;
  rows?: number;
}

/** Placeholder for the 3-column profile posts grid. */
export default function PostGridSkeleton({ cellWidth, cellMargin = 0, rows = 3 }: Props) {
  return (
    <SkeletonGroup label="Loading posts" style={styles.grid}>
      {Array.from({ length: rows * 3 }).map((_, i) => (
        <Skeleton
          key={i}
          width={cellWidth}
          height={cellWidth * 1.3}
          radius={0}
          style={{ marginHorizontal: cellMargin, marginTop: 2 }}
        />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
