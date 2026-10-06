import React from "react";
import { View, StyleSheet } from "react-native";

import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

export default function CommentSkeleton() {
  return (
    <SkeletonGroup label="Loading comments" style={styles.container}>
      {[1, 2, 3, 4, 5].map((item) => (
        <View
          key={item}
          style={styles.comment}
        >
          <Skeleton
            width={46}
            height={46}
            radius={23}
          />

          <View style={styles.right}>
            <Skeleton
              width={120}
              height={15}
            />

            <View style={{ height: 8 }} />

            <Skeleton
              width="100%"
              height={14}
            />

            <View style={{ height: 6 }} />

            <Skeleton
              width="75%"
              height={14}
            />

            <View style={{ height: 12 }} />

            <View
              style={{
                flexDirection: "row",
              }}
            >
              <Skeleton
                width={45}
                height={12}
              />

              <View style={{ width: 20 }} />

              <Skeleton
                width={50}
                height={12}
              />
            </View>
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  comment: {
    flexDirection: "row",
    marginBottom: 24,
  },

  right: {
    flex: 1,
    marginLeft: 14,
  },
});