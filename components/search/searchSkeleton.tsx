import React from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";

import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

// Search cards use a fixed translucent border in both themes
const CARD_BORDER = "rgba(148, 163, 184, 0.16)";
const SECTION_COUNT = 3;
const CARDS_PER_SECTION = 2;
const META_WIDTHS: DimensionValue[] = ["70%", "55%", "60%"];

/** One placeholder matching RecentUserCard / TrendingUserCard: avatar, name, level, school lines. */
function SearchUserCardSkeleton({ width }: { width?: number }) {
  return (
    <View style={[styles.card, width ? { width } : null]}>
      <View style={styles.headerRow}>
        <SkeletonCircle size={48} />
        <View style={styles.nameCol}>
          <Skeleton width="55%" height={16} radius={8} />
          <Skeleton width={56} height={16} radius={8} />
        </View>
      </View>
      <View style={styles.meta}>
        {META_WIDTHS.map((w, i) => (
          <View key={i} style={styles.metaRow}>
            <SkeletonCircle size={14} />
            <Skeleton width={w} height={10} radius={5} />
          </View>
        ))}
      </View>
    </View>
  );
}

/** Placeholder for the search home: recent, suggested and trending rows of cards. */
export function SearchSectionsSkeleton() {
  return (
    <SkeletonGroup label="Loading suggestions">
      {Array.from({ length: SECTION_COUNT }).map((_, s) => (
        <View key={s} style={styles.section}>
          <Skeleton width={170} height={20} radius={10} style={styles.sectionTitle} />
          <View style={styles.cardRow}>
            {Array.from({ length: CARDS_PER_SECTION }).map((__, i) => (
              <View key={i} style={styles.cardRowItem}>
                <SearchUserCardSkeleton width={280} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

/** Stacked result card placeholders while a search query is running. */
export function SearchResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup label="Searching" style={styles.results}>
      {Array.from({ length: count }).map((_, i) => (
        <SearchUserCardSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

/** One placeholder matching SuggestedUserCard on the search results screen. */
function SuggestedUserRowSkeleton() {
  return (
    <View style={styles.suggestedCard}>
      <SkeletonCircle size={64} />
      <View style={styles.suggestedText}>
        <Skeleton width="55%" height={18} radius={9} />
        <Skeleton width="35%" height={13} radius={6} />
        <Skeleton width="60%" height={13} radius={6} />
      </View>
      <Skeleton width={84} height={38} radius={19} />
    </View>
  );
}

/** Result row placeholders for the full search results screen. */
export function SuggestedUserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SkeletonGroup label="Searching" style={styles.suggestedList}>
      {Array.from({ length: count }).map((_, i) => (
        <SuggestedUserRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameCol: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  meta: {
    marginTop: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    marginHorizontal: 20,
  },
  cardRow: {
    flexDirection: "row",
    overflow: "hidden",
    paddingLeft: 20,
    marginTop: 16,
  },
  cardRowItem: {
    marginRight: 14,
  },
  results: {
    gap: 12,
  },
  suggestedList: {
    padding: 20,
    gap: 18,
  },
  suggestedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  suggestedText: {
    flex: 1,
    marginLeft: 16,
    gap: 6,
  },
});
