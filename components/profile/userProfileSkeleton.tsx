import React from "react";
import { Dimensions, Pressable, StatusBar, StyleSheet, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton";
import PostGridSkeleton from "./postGridSkeleton";

const GRID_CELL = Dimensions.get("window").width / 3;
const STAT_COUNT = 4;

/**
 * Placeholder for another user's profile page. The back button stays real so
 * people can leave while the profile is still loading.
 */
export default function UserProfileSkeleton({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { borderColor: colors.border }]}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
      </View>

      <SkeletonGroup label="Loading profile">
        {/* Avatar, name, level badge and bio */}
        <View style={styles.hero}>
          <SkeletonCircle size={78} />
          <View style={styles.info}>
            <Skeleton width="60%" height={20} radius={10} />
            <Skeleton width={70} height={18} radius={9} />
            <SkeletonText lines={2} lineHeight={12} lastLineWidth="70%" />
          </View>
        </View>

        {/* School / faculty chips */}
        <View style={styles.chips}>
          <Skeleton width={120} height={24} radius={12} />
          <Skeleton width={100} height={24} radius={12} />
        </View>

        {/* Likes / posts / followers / following */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          {Array.from({ length: STAT_COUNT }).map((_, i) => (
            <View key={i} style={styles.statItem}>
              <Skeleton width={30} height={16} radius={8} />
              <Skeleton width={52} height={10} radius={5} />
            </View>
          ))}
        </View>

        {/* Follow / message buttons */}
        <View style={styles.actions}>
          <Skeleton width="48%" height={42} radius={21} style={styles.actionButton} />
          <Skeleton width="48%" height={42} radius={21} style={styles.actionButton} />
        </View>

        <View style={[styles.tabs, { borderColor: colors.border }]}>
          <Skeleton width={50} height={12} radius={6} />
        </View>

        <PostGridSkeleton cellWidth={GRID_CELL} rows={2} />
      </SkeletonGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
  },
  info: {
    flex: 1,
    marginLeft: 16,
    marginTop: 16,
    gap: 10,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    marginTop: 20,
    marginHorizontal: 16,
  },
  statItem: {
    alignItems: "center",
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flexShrink: 1,
  },
  tabs: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
