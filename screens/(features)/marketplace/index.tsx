import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CategoryTabs from "@/components/marketPlace/categoryTab";
import MarketplaceGridSkeleton from "@/components/marketPlace/productCardSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { marketplaceService } from "@/service/marketplace.service";
import getRelativeTime from "@/service/helper";
import { ThemedText } from "@/components/ui/ThemedText";
import { useAuthStore } from "@/store";
import AuthHeader from "@/components/auth/authHeader";
import { useSyncSignal } from "@/hooks/useSyncSignal";
import { syncKeys } from "@/store/syncStore";
import { url } from "zod";

type MarketplaceItem = {
  id: string;
  title: string;
  price?: number;
  photos?: string[];
  image?: string;
  imageUrls?: string[];
  condition?: string;
  location?: string;
  createdAt?: string;
  userId?: string; 
  sellerId?: string; 
};

export default function MarketplaceScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const showGridSkeleton = useDelayedLoading(loading);
  const [error, setError] = useState<string | null>(null);

  // Search, Category, and Pagination states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchItems = async (
    pageNumber: number = 1,
    isRefresh: boolean = false,
    search: string = searchQuery,
    category: string = selectedCategory
  ) => {
    try {
      if (pageNumber === 1 && !isRefresh) {
        setLoading(true);
      }
      setError(null);

      const response = await marketplaceService.getAllItems({
        page: pageNumber,
        limit: 20,
        search: search.trim() || undefined,
        category: category !== "All" ? category : undefined,
      });

      const newItems = Array.isArray(response) ? response : response?.items || [];
      const totalPages = response?.meta?.totalPages || 1;

      setHasMore(pageNumber < totalPages);

      if (pageNumber === 1) {
        setItems(newItems);
      } else {
        setItems((prev) => [...prev, ...newItems]);
      }
      setPage(pageNumber);
    } catch (err: any) {
      setError(err?.message || "Failed to load marketplace items. Please check your connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // A listing created/edited elsewhere syncs in the background — refresh once
  // it settles so the grid isn't left on a stale snapshot.
  useSyncSignal(syncKeys.marketplaceList, () => fetchItems(1, true));

  useEffect(() => {
    fetchItems(1, false, searchQuery, selectedCategory);
  }, [selectedCategory]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems(1, false, searchQuery, selectedCategory);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategorySelect = (category: string) => {
    if (category === selectedCategory) return;
    setSelectedCategory(category);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems(1, true, searchQuery, selectedCategory);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading && items.length > 0 && !error) {
      setLoadingMore(true);
      fetchItems(page + 1, false, searchQuery, selectedCategory);
    }
  };

  const handleItemPress = (id: string) => {
    router.push(`/marketplace/${id}` as any);
  };

  // Handle Edit Action from 3-dot Menu
  const handleEditItem = (item: MarketplaceItem) => {
    router.push({
      pathname: "/(features)/marketplace/add",
      params: { id: item.id },
    } as any);
  };

  const handleMoreOptions = (item: MarketplaceItem) => {
    Alert.alert(
      "Item Options",
      `Manage "${item.title}"`,
      [
        {
          text: "Edit Listing",
          onPress: () => handleEditItem(item),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const renderProductCard = ({ item }: { item: MarketplaceItem }) => {
    const photoUri =
      item.imageUrls?.[0] || item.photos?.[0] || item.image || "https://via.placeholder.com/300";

    // 3. Check if current user is the owner of this item
    const itemOwnerId = item.userId || item.sellerId;
    const isOwner = user?.id && itemOwnerId === user.id;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#27272A" : "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark ? "#3F3F46" : "#E5E7EB",
          },
        ]}
        activeOpacity={0.85}
        onPress={() => handleItemPress(item.id)}
      >
        <ThemedView style={styles.imageContainer}>
          <Image source={{ uri: photoUri }} style={styles.cardImage} resizeMode="cover" />
          {item.imageUrls && item.imageUrls.length > 1 && (
            <ThemedView style={styles.badge}>
              <ThemedText style={styles.badgeText}>{item.imageUrls.length}</ThemedText>
            </ThemedView>
          )}

          {/* 4. Three Dots Icon Button rendered ONLY if user is the owner */}
          {isOwner && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={(e) => {
                e.stopPropagation();
                handleMoreOptions(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="more-vertical" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </ThemedView>

        <ThemedView style={styles.cardDetails}>
          <ThemedView style={styles.titleRow}>
            <ThemedText
              style={[styles.itemTitle, { color: isDark ? "#F4F4F5" : "#111827" }]}
              numberOfLines={1}
            >
              {item.title}
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.priceRow}>
            <ThemedText style={styles.priceText}>
              ₦{item.price ? item.price.toLocaleString() : "0"}
            </ThemedText>
            {item.condition && (
              <ThemedView style={styles.conditionBadge}>
                <ThemedText style={styles.conditionText}>{item.condition}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          <ThemedView style={styles.metaRow}>
            <ThemedText style={[styles.timeText, { color: isDark ? "#71717A" : "#9CA3AF" }]}>
              {getRelativeTime(item.createdAt || "Recently")}
            </ThemedText>
          </ThemedView>
        </ThemedView>
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
   <AuthHeader
  title={t("marketplace.title")}
  subtitle={t("marketplace.subtitle")}
  rightElement={
    <TouchableOpacity
      onPress={() => router.push("/(features)/marketplace/myListings" as any)}
      style={{ padding: 6 }}
    >
      <Feather name="list" size={22} color={colors.text} />
    </TouchableOpacity>
  }
/>
      <FlatList
        data={error ? [] : items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={items.length > 0 && !error ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.content}
        renderItem={renderProductCard}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6C47FF" />
        }
        ListHeaderComponent={
          <>
            <CategoryTabs
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />

            <ThemedView className="mt-4 bg-transparent">
              <Image
                source={{ uri: "https://res.cloudinary.com/dyz7znlj0/image/upload/v1787946845/sell-banner_bdghny.png" }}
                className="w-full h-40 rounded-3xl"
                resizeMode="cover"
              />
            </ThemedView>

            {/* Search Input Bar */}
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: isDark ? "#27272A" : "#F3F4F6",
                  borderColor: isDark ? "#3F3F46" : "#E5E7EB",
                },
              ]}
            >
              <Feather name="search" size={18} color={isDark ? "#A1A1AA" : "#9CA3AF"} />
              <TextInput
                style={[styles.searchInput, { color: isDark ? "#F4F4F5" : "#111827" }]}
                placeholder={t("marketplace.searchPlaceholder")}
                placeholderTextColor={isDark ? "#71717A" : "#9CA3AF"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={18} color={isDark ? "#A1A1AA" : "#9CA3AF"} />
                </TouchableOpacity>
              )}
            </View>

            <ThemedView style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: isDark ? "#F4F4F5" : "#111827" }]}>
                {searchQuery
                  ? "Search Results"
                  : selectedCategory !== "All"
                  ? `${selectedCategory} Listings`
                  : "Recent Listings"}
              </ThemedText>
            </ThemedView>

            {/* First load shows the grid skeleton; reloads over existing items keep the small spinner */}
            {loading && page === 1 && (
              items.length === 0 ? (
                showGridSkeleton ? <MarketplaceGridSkeleton /> : null
              ) : (
                <ThemedView style={styles.centerContainer}>
                  <ActivityIndicator size="small" color="#6C47FF" />
                </ThemedView>
              )
            )}

            {/* CUSTOM ERROR STATE */}
            {!loading && error && (
              <ThemedView
                style={[
                  styles.errorCard,
                  {
                    backgroundColor: isDark ? "#27272A" : "#FEF2F2",
                    borderColor: isDark ? "#7F1D1D" : "#FCA5A5",
                  },
                ]}
              >
                <View
                  style={[
                    styles.errorIconWrapper,
                    { backgroundColor: isDark ? "#450A0A" : "#FEE2E2" },
                  ]}
                >
                  <View
                    style={[
                      styles.errorInnerCircle,
                      { backgroundColor: isDark ? "#7F1D1D" : "#FECACA" },
                    ]}
                  >
                    <Feather name="alert-triangle" size={30} color="#EF4444" />
                  </View>
                </View>

                <ThemedText
                  style={[
                    styles.errorTitle,
                    { color: isDark ? "#F87171" : "#991B1B" },
                  ]}
                >
                  Something Went Wrong
                </ThemedText>

                <ThemedText
                  style={[
                    styles.errorSubtext,
                    { color: isDark ? "#A1A1AA" : "#7F1D1D" },
                  ]}
                >
                  {/* {error} */}
                </ThemedText>

                <TouchableOpacity
                  style={styles.retryButton}
                  activeOpacity={0.85}
                  onPress={() => fetchItems(1, false, searchQuery, selectedCategory)}
                >
                  <Feather name="refresh-cw" size={15} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}

            {/* STYLED EMPTY STATE */}
            {!loading && !error && items.length === 0 && (
              <ThemedView
                style={[
                  styles.emptyCard,
                  {
                    backgroundColor: isDark ? "#27272A" : "#FAFAFA",
                    borderColor: isDark ? "#3F3F46" : "#F3F4F6",
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyIconWrapper,
                    { backgroundColor: isDark ? "#3F3F46" : "#F3F0FF" },
                  ]}
                >
                  <View
                    style={[
                      styles.emptyInnerCircle,
                      { backgroundColor: isDark ? "#52525B" : "#E8E0FF" },
                    ]}
                  >
                    <Feather name="shopping-bag" size={32} color="#6C47FF" />
                  </View>
                </View>

                <ThemedText
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? "#F4F4F5" : "#111827" },
                  ]}
                >
                  {searchQuery || selectedCategory !== "All"
                    ? "No Matches Found"
                    : "No Listings Available"}
                </ThemedText>

                <ThemedText
                  style={[
                    styles.emptySubtext,
                    { color: isDark ? "#A1A1AA" : "#6B7280" },
                  ]}
                >
                  {searchQuery
                    ? `We couldn't find any items matching "${searchQuery}".`
                    : selectedCategory !== "All"
                    ? `No items listed under "${selectedCategory}" yet.`
                    : "Be the first on campus to post something for sale or check back later!"}
                </ThemedText>

                <TouchableOpacity
                  style={styles.emptyButton}
                  activeOpacity={0.85}
                  onPress={() => router.push("/(features)/marketplace/add" as any)}
                >
                  <Feather name="plus-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <ThemedText style={styles.emptyButtonText}>Post an Item</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            )}
          </>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#6C47FF" />
            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ]}
        onPress={() => router.push("/(features)/marketplace/add" as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
  columnWrapper: { justifyContent: "space-between" },
  sectionHeader: { marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  centerContainer: { paddingVertical: 32, alignItems: "center", justifyContent: "center" },
  footerLoader: { paddingVertical: 16, alignItems: "center" },

  // Search Bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },

  // Custom Error State Styles
  errorCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  errorIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  errorSubtext: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 260,
  },
  retryButton: {
    height: 40,
    paddingHorizontal: 20,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // Empty State Styles
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  emptyIconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 240,
  },
  emptyButton: {
    height: 40,
    paddingHorizontal: 18,
    backgroundColor: "#6C47FF",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // Card Styles
  card: {
    borderRadius: 16,
    marginBottom: 14,
    width: "48.5%",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  imageContainer: { height: 130, width: "100%", position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#6C47FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  moreButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardDetails: { padding: 10 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemTitle: { fontSize: 13, fontWeight: "700", flex: 1, marginRight: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", marginVertical: 6, gap: 6 },
  priceText: { fontSize: 14, fontWeight: "800", color: "#6C47FF" },
  conditionBadge: { backgroundColor: "#ECFDF5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  conditionText: { fontSize: 10, color: "#10B981", fontWeight: "600" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  timeText: { fontSize: 10 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 50,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});