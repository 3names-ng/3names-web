import React from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup, SkeletonText } from "@/components/ui/skeleton";

/**
 * Skeletons shared by the marketplace and hostel screens, which use the same
 * "My listings" row and the same photo-first detail page layout.
 */

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SPEC_COUNT = 3;

/** One placeholder matching a "My listings" row: thumbnail, title, price, status pill, time. */
function MyListingRowSkeleton() {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isDark ? "#27272A" : "#FFFFFF",
          borderColor: isDark ? "#3F3F46" : "#E5E7EB",
        },
      ]}
    >
      <Skeleton width={96} height={96} radius={0} />
      <View style={styles.rowBody}>
        <Skeleton width="70%" height={14} radius={7} />
        <Skeleton width={70} height={13} radius={6} />
        <Skeleton width={76} height={20} radius={10} />
        <Skeleton width={48} height={10} radius={5} />
      </View>
    </View>
  );
}

/** List of "My listings" row placeholders. */
export function MyListingsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading your listings" style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <MyListingRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

/**
 * Placeholder for a listing detail page: full-width photo, title, price, a
 * specs card, description and seller. The back button stays real so people can
 * leave while the listing is still loading.
 */
export function ListingDetailSkeleton({
  imageHeight,
  onBack,
}: {
  imageHeight: number;
  onBack: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.detail, { backgroundColor: colors.background }]}>
      <SkeletonGroup label="Loading listing">
        <Skeleton width={SCREEN_WIDTH} height={imageHeight} radius={0} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <Skeleton width="85%" height={22} radius={11} />
              <Skeleton width="55%" height={13} radius={6} />
              <Skeleton width="70%" height={12} radius={6} />
            </View>
            <Skeleton width={90} height={24} radius={12} />
          </View>

          <View style={[styles.specCard, { borderColor: colors.border }]}>
            {Array.from({ length: SPEC_COUNT }).map((_, i) => (
              <View key={i} style={styles.specItem}>
                <SkeletonCircle size={18} />
                <Skeleton width={50} height={10} radius={5} />
                <Skeleton width={40} height={12} radius={6} />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Skeleton width={100} height={14} radius={7} />
            <SkeletonText lines={4} lineHeight={12} lastLineWidth="65%" />
          </View>

          <View style={styles.seller}>
            <SkeletonCircle size={44} />
            <View style={styles.sellerText}>
              <Skeleton width={120} height={14} radius={7} />
              <Skeleton width={80} height={11} radius={5} />
            </View>
          </View>
        </View>
      </SkeletonGroup>

      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={[styles.backButton, { top: insets.top + 10 }]}
      >
        <Feather name="chevron-left" size={22} color="#111827" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  rowBody: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  detail: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  titleCol: {
    flex: 1,
    gap: 10,
  },
  specCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
  },
  specItem: {
    alignItems: "center",
    gap: 6,
  },
  section: {
    gap: 12,
  },
  seller: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerText: {
    gap: 6,
  },
  backButton: {
    position: "absolute",
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
});
