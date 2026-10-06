import React, { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import AuthHeader from "@/components/auth/authHeader";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { MyListingsSkeleton } from "@/components/ui/listingSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { useTheme } from "@/hooks/useTheme";
import { marketplaceService } from "@/service/marketplace.service";
import getRelativeTime from "@/service/helper";
import { useSyncSignal } from "@/hooks/useSyncSignal";
import { syncKeys } from "@/store/syncStore";

type ModerationStatus = "pending" | "approved" | "rejected";
type AvailabilityStatus = "available" | "taken" | "unavailable";

interface MyMarketplaceItem {
  id: string;
  title: string;
  price?: number;
  imageUrls?: string[];
  condition?: string;
  createdAt?: string;
  moderationStatus: ModerationStatus;
  rejectionReason?: string | null;
  status?: AvailabilityStatus;
  isAvailable?: boolean;
}

interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  icon: keyof typeof Feather.glyphMap;
}

const MODERATION_META: Record<Exclude<ModerationStatus, "approved">, StatusMeta> = {
  pending: { label: "Pending Review", color: "#B45309", bg: "#FEF3C7", icon: "clock" },
  rejected: { label: "Not Approved", color: "#B91C1C", bg: "#FEE2E2", icon: "x-circle" },
};

const LIVE_META: StatusMeta = { label: "Live", color: "#15803D", bg: "#DCFCE7", icon: "check-circle" };
const CLOSED_META: StatusMeta = { label: "Closed", color: "#52525B", bg: "#F4F4F5", icon: "slash" };

/**
 * Moderation and availability are separate: an approved listing can still be
 * "Closed" by its owner. "Live" only applies once it's both approved AND
 * still available — otherwise the badge would keep saying "Live" even after
 * the seller closed it.
 */
function getDisplayStatus(item: MyMarketplaceItem): StatusMeta {
  if (item.moderationStatus !== "approved") {
    return MODERATION_META[item.moderationStatus];
  }
  const isOpen = item.isAvailable !== false && item.status !== "taken" && item.status !== "unavailable";
  return isOpen ? LIVE_META : CLOSED_META;
}

export default function MyMarketplaceListingsScreen() {
  const { colors, isDark } = useTheme();
  const [items, setItems] = useState<MyMarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const showSkeleton = useDelayedLoading(loading);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await marketplaceService.getMyListings();
      const data = Array.isArray(response) ? response : response?.items ?? response?.data ?? [];
      setItems(data);
    } catch (err) {
      console.error("Failed to fetch my marketplace listings:", err);
      setError("Unable to load your listings. Please check your network connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch whenever the screen regains focus, so returning here after
  // editing a listing shows the updated data immediately.
  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings]),
  );

  // An edit can still be syncing when we regain focus, so refresh again when
  // the background write settles.
  useSyncSignal(syncKeys.marketplaceList, () => fetchListings(true));

  const renderItem = ({ item }: { item: MyMarketplaceItem }) => {
    const meta = getDisplayStatus(item);
    const photoUri = item.imageUrls?.[0] || "https://via.placeholder.com/150";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#27272A" : "#FFFFFF",
            borderColor: isDark ? "#3F3F46" : "#E5E7EB",
          },
        ]}
        onPress={() => router.push(`/(features)/marketplace/${item.id}` as any)}
      >
        <Image source={{ uri: photoUri }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.cardBody}>
          <ThemedText numberOfLines={1} style={styles.title}>
            {item.title}
          </ThemedText>
          <ThemedText style={styles.price}>
            ₦{item.price ? item.price.toLocaleString() : "0"}
          </ThemedText>

          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Feather name={meta.icon} size={12} color={meta.color} />
            <ThemedText style={[styles.statusText, { color: meta.color }]}>
              {meta.label}
            </ThemedText>
          </View>

          {item.moderationStatus === "rejected" && item.rejectionReason && (
            <ThemedText numberOfLines={2} style={styles.reasonText}>
              Reason: {item.rejectionReason}
            </ThemedText>
          )}

          <ThemedText style={[styles.timeText, { color: colors.muted }]}>
            {getRelativeTime(item.createdAt || "")}
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent={false}
        backgroundColor={isDark ? "#18181B" : "#FFFFFF"}
        barStyle={isDark ? "light-content" : "dark-content"}
      />
      <AuthHeader title="My Listings" subtitle="Track approval status for your marketplace items" />

      {loading ? (
        showSkeleton ? <MyListingsSkeleton /> : null
      ) : error ? (
        <View style={styles.centered}>
          <Feather name="alert-circle" size={32} color="#EF4444" />
          <ThemedText style={styles.emptyTitle}>{error}</ThemedText>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchListings()}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.retryText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchListings(true)}
              tintColor="#6C47FF"
            />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Feather name="package" size={32} color={colors.muted} />
              <ThemedText style={[styles.emptyTitle, { color: colors.muted }]}>
                You haven't listed anything yet.
              </ThemedText>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => router.push("/(features)/marketplace/add" as any)}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.retryText}>Create a Listing</ThemedText>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#6C47FF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  thumb: { width: 96, height: 96 },
  cardBody: { flex: 1, padding: 12, gap: 4 },
  title: { fontSize: 14, fontWeight: "700" },
  price: { fontSize: 13, fontWeight: "600", color: "#6C47FF" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 2,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  reasonText: { fontSize: 11, color: "#B91C1C" },
  timeText: { fontSize: 11, marginTop: 2 },
});
