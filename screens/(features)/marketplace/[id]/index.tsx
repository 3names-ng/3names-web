import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useTheme } from "@/hooks/useTheme";
import { marketplaceService } from "@/service/marketplace.service";
import { useAuthStore } from "@/store";
import { ThemedText } from "@/components/ui/ThemedText";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { ListingDetailSkeleton } from "@/components/ui/listingSkeleton";
import ReportContentSheet from "@/components/ui/reportContentSheet";
import { useSyncSignal } from "@/hooks/useSyncSignal";
import { syncKeys } from "@/store/syncStore";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { colors, isDark } = useTheme();
  const currentUser = useAuthStore((state) => state.user);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showReport, setShowReport] = useState(false);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [togglingListing, setTogglingListing] = useState(false);

  // Refetch whenever the screen regains focus, so returning from the edit
  // screen after a successful update shows the new data immediately instead
  // of the stale pre-edit state.
  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setError("Item ID is missing.");
        setLoading(false);
        return;
      }

      fetchItemDetails();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]),
  );

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketplaceService.getItemById(id as string);

      const result = data?.data || data;
    
      setItem(result);
      setIsLiked(result?.isLiked || false);
    } catch (err: any) {
      console.error(
        `[marketplace/${id}] fetch failed:`,
        err?.response?.status,
        err?.response?.data || err?.message
      );
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch item details."
      );
    } finally {
      setLoading(false);
    }
  };

  // An edit can still be syncing when we regain focus, so refetch again when
  // the background write settles.
  useSyncSignal(id ? syncKeys.marketplace(id) : undefined, fetchItemDetails);

  const performToggleListing = async (closing: boolean) => {
    if (!item?.id) return;
    try {
      setTogglingListing(true);
      const response = closing
        ? await marketplaceService.markAsUnavailable(item.id)
        : await marketplaceService.markAsAvailable(item.id);
      const updated = response?.data || response;
      setItem((prev: any) => ({
        ...prev,
        status: updated?.status ?? (closing ? "unavailable" : "available"),
        isAvailable: updated?.isAvailable ?? !closing,
      }));
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          `Failed to ${closing ? "close" : "reopen"} this listing. Please try again.`
      );
    } finally {
      setTogglingListing(false);
    }
  };

  const handleToggleListing = (isCurrentlyClosed: boolean) => {
    if (isCurrentlyClosed) {
      performToggleListing(false);
      return;
    }
    Alert.alert(
      "Close Listing?",
      "Buyers won't be able to see or contact you about this listing until you reopen it.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Close Listing", style: "destructive", onPress: () => performToggleListing(true) },
      ]
    );
  };

  if (loading) {
    return <ListingDetailSkeleton imageHeight={320} onBack={() => router.back()} />;
  }

  // --- STYLED EMPTY / NOT FOUND STATE ---
  if (error || !item) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? "light-content" : "dark-content"} />
        
        {/* Top Header Back Button */}
        <SafeAreaView style={styles.notFoundHeader}>
          <TouchableOpacity style={styles.floatingIconButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color="#111827" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.emptyCard}>
          {/* Decorative Icon Graphic */}
          <View style={[styles.iconWrapper, { backgroundColor: isDark ? "#27272A" : "#F3F0FF" }]}>
            <View style={[styles.innerIconCircle, { backgroundColor: isDark ? "#3F3F46" : "#E8E0FF" }]}>
              <Feather name="package" size={42} color="#6C47FF" />
            </View>
          </View>

          {/* Text Details */}
          <Text style={[styles.emptyTitle, { color: isDark ? "#F4F4F5" : "#111827" }]}>
            Item Not Found
          </Text>
          <Text style={[styles.emptySubtext, { color: isDark ? "#A1A1AA" : "#6B7280" }]}>
            {error || "This listing may have been deleted, sold, or is temporarily unavailable."}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity style={styles.primaryActionButton} onPress={fetchItemDetails}>
              <Feather name="refresh-cw" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryActionButton,
                { borderColor: isDark ? "#3F3F46" : "#E5E7EB", backgroundColor: isDark ? "#27272A" : "#F9FAFB" },
              ]}
              onPress={() => router.back()}
            >
              <Text style={[styles.secondaryActionText, { color: isDark ? "#E4E4E7" : "#374151" }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const photos: string[] =
    item.imageUrls?.length > 0
      ? item.imageUrls
      : item.image
        ? [item.image]
        : ["https://via.placeholder.com/400"];

  const sellerId = item?.seller?.id || item?.sellerId || item?.userId;
  const isOwner = currentUser?.id && sellerId === currentUser?.id;
  const isClosed = item.status !== "available";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? "light-content" : "dark-content"} />
      <ReportContentSheet
        visible={showReport}
        targetType="marketplace_item"
        targetId={item.id}
        subject="listing"
        onClose={() => setShowReport(false)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Photo Gallery */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.ceil(
                e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
              );
              if (slide !== activeImageIndex) setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {photos.map((photoUri: string, index: number) => (
              <Pressable key={index} onPress={() => setLightboxVisible(true)}>
                <Image source={{ uri: photoUri }} style={styles.carouselImage} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>

          {/* Nav Header Overlay */}
          <SafeAreaView style={styles.floatingHeader}>
            <TouchableOpacity style={styles.floatingIconButton} onPress={() => router.back()}>
              <Feather name="chevron-left" size={22} color="#111827" />
            </TouchableOpacity>
            {isOwner ? (
              <TouchableOpacity
                style={styles.floatingIconButton}
                onPress={() => router.push({ pathname: "/(features)/marketplace/add", params: { id: item.id } })}
              >
                <Feather name="edit-2" size={18} color="#111827" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.floatingIconButton}
                onPress={() => setShowReport(true)}
                accessibilityLabel="Report listing"
              >
                <Feather name="flag" size={18} color="#111827" />
              </TouchableOpacity>
            )}
          </SafeAreaView>

          {/* Indicator */}
          <View style={styles.paginationBadge}>
            <Feather name="image" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.paginationText}>
              {activeImageIndex + 1}/{photos.length}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.contentPadding}>
          <View style={styles.priceContainer}>
            <View>
              <View style={styles.priceRow}>
                <Text style={styles.priceText}>₦{Number(item.price || 0).toLocaleString()}</Text>
                {item.discountPrice && (
                  <Text style={styles.originalPriceText}>
                    ₦{Number(item.discountPrice).toLocaleString()}
                  </Text>
                )}
              </View>
              {item.isNegotiable && <Text style={styles.negotiableText}>Negotiable</Text>}
            </View>

            {item.condition && (
              <View style={styles.conditionTag}>
                <Text style={styles.conditionText}>{item.condition}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.productTitle, { color: isDark ? "#F4F4F5" : "#111827" }]}>
            {item.title}
          </Text>

          <View style={styles.locationRow}>
            <View style={styles.iconLabel}>
              <Ionicons name="location-outline" size={15} color="#6C47FF" />
              <Text style={[styles.locationText, { color: isDark ? "#A1A1AA" : "#4B5563" }]}>
                {item.school?.name || "Campus"}
              </Text>
            </View>
          </View>

          {/* Specs */}
          <View
            style={[
              styles.specGrid,
              {
                backgroundColor: isDark ? "#27272A" : "#F9FAFB",
                borderColor: isDark ? "#3F3F46" : "#F3F4F6",
              },
            ]}
          >
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Category</Text>
              <Text style={[styles.specValue, { color: isDark ? "#F4F4F5" : "#111827" }]}>
                {item.category || "General"}
              </Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Brand</Text>
              <Text style={[styles.specValue, { color: isDark ? "#F4F4F5" : "#111827" }]}>
                {item.brand || "N/A"}
              </Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Model</Text>
              <Text style={[styles.specValue, { color: isDark ? "#F4F4F5" : "#111827" }]}>
                {item.model || "N/A"}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.sectionMargin}>
            <Text style={[styles.sectionHeading, { color: isDark ? "#F4F4F5" : "#111827" }]}>
              Description
            </Text>
            <Text style={[styles.descriptionText, { color: isDark ? "#D4D4D8" : "#374151" }]}>
              {item.description || "No description provided."}
            </Text>
          </View>

          {/* Seller Profile */}
          {item.seller && (
            <View
              style={[
                styles.sellerCard,
                {
                  backgroundColor: isDark ? "#27272A" : "#FFFFFF",
                  borderColor: isDark ? "#3F3F46" : "#E5E7EB",
                },
              ]}
            >
              <View style={styles.sellerHeader}>
                <ProfileFrame
                  frameId={item.seller.profileFrame}
                  uri={item.seller.profilePictureUrl}
                  size={48}
                  initial={item.seller.username?.[0]?.toUpperCase()}
                />
                <View style={styles.sellerMeta}>
                  <View style={styles.sellerNameRow}>
                    <Text style={[styles.sellerName, { color: isDark ? "#F4F4F5" : "#111827" }]}>
                      {item.seller.username || "Unknown Seller"}
                    </Text>

                    {item.seller.verified && (
                      <MaterialCommunityIcons name="check-decagram" size={16} color="#6C47FF" />
                    )}
                  </View>
                  {/* The API only sends a phone number for your own listings
                      (other users' phone numbers are private). */}
                  {!!item.seller.phoneNumber && (
                    <Text style={[styles.sellerName, { color: colors.muted }]}>
                      {item.seller.phoneNumber}
                    </Text>
                  )}
                  <Text style={styles.sellerLevelText}>
                    {item.seller.appLevel || "Campus Vendor"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
      
        ]}
      >
        {isOwner ? (
          <Pressable
            disabled={togglingListing}
            onPress={() => handleToggleListing(isClosed)}
            className={`flex-1 h-12 rounded-xl border flex-row items-center justify-center space-x-2 active:opacity-80 ${
              isClosed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
            style={{ opacity: togglingListing ? 0.6 : 1 }}
          >
            {togglingListing ? (
              <ActivityIndicator size="small" color={isClosed ? "#16A34A" : "#EF4444"} />
            ) : (
              <>
                <Feather name={isClosed ? "refresh-cw" : "slash"} size={16} color={isClosed ? "#16A34A" : "#EF4444"} />
                <ThemedText className={`font-bold text-sm ml-2 ${isClosed ? "text-green-600" : "text-red-600"}`}>
                  {isClosed ? "Reopen Listing" : "Close Listing"}
                </ThemedText>
              </>
            )}
          </Pressable>
        ) : (
          <TouchableOpacity
            onPress={() => {
              if (sellerId) {
                router.push({
                  pathname: "/chatScreen",
                  params: {
                    id: sellerId,
                    isUserId: "true",
                    user: JSON.stringify(item.seller),
                  },
                });
              }
            }}
            style={[
              styles.chatButton,
              { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primary },
            ]}
            className="flex-1 h-12 rounded-xl flex-row items-center justify-center space-x-2 active:opacity-90"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={[styles.chatButtonText, { color: "#FFF" }]}>Contact Seller</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lightbox */}
      <Modal visible={lightboxVisible} transparent animationType="fade">
        <View style={styles.lightboxContainer}>
          <TouchableOpacity style={styles.closeLightboxButton} onPress={() => setLightboxVisible(false)}>
            <Feather name="x" size={24} color="#FFF" />
          </TouchableOpacity>
          <Image source={{ uri: photos[activeImageIndex] }} style={styles.lightboxImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  
  // Empty State Styling
  notFoundHeader: { position: "absolute", top: 10, left: 16, right: 16, zIndex: 10 },
  emptyCard: { alignItems: "center", width: "100%", maxWidth: 320 },
  iconWrapper: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  innerIconCircle: { width: 68, height: 68, borderRadius: 34, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  emptySubtext: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 },
  actionButtonGroup: { width: "100%", gap: 10 },
  primaryActionButton: { height: 48, backgroundColor: "#6C47FF", borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%" },
  primaryActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  secondaryActionButton: { height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", width: "100%" },
  secondaryActionText: { fontSize: 14, fontWeight: "600" },

  // Carousel & Body
  carouselContainer: { width, height: 320, position: "relative" },
  carouselImage: { width, height: 320 },
  floatingHeader: { position: "absolute", top: 10, left: 16, right: 16, flexDirection: "row", justifyContent: "space-between" },
  floatingIconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255, 255, 255, 0.9)", alignItems: "center", justifyContent: "center" },
  paginationBadge: { position: "absolute", bottom: 12, right: 16, backgroundColor: "rgba(17, 24, 39, 0.75)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center" },
  paginationText: { color: "#FFFFFF", fontSize: 11, fontWeight: "600" },
  contentPadding: { paddingHorizontal: 16, paddingTop: 16 },
  priceContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  priceText: { fontSize: 22, fontWeight: "800", color: "#6C47FF" },
  originalPriceText: { fontSize: 14, color: "#9CA3AF", textDecorationLine: "line-through" },
  negotiableText: { fontSize: 11, color: "#10B981", fontWeight: "600", marginTop: 2 },
  conditionTag: { backgroundColor: "#ECFDF5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  conditionText: { fontSize: 12, fontWeight: "700", color: "#059669" },
  productTitle: { fontSize: 18, fontWeight: "700", lineHeight: 24, marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  iconLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12, fontWeight: "500" },
  specGrid: { flexDirection: "row", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, justifyContent: "space-between", marginBottom: 20 },
  specItem: { flex: 1, alignItems: "center" },
  specDivider: { width: 1, backgroundColor: "#E5E7EB", height: "100%" },
  specLabel: { fontSize: 11, color: "#6B7280", marginBottom: 2 },
  specValue: { fontSize: 12, fontWeight: "700" },
  sectionMargin: { marginBottom: 20 },
  sectionHeading: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  descriptionText: { fontSize: 13, lineHeight: 20 },
  sellerCard: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 16 },
  sellerHeader: { flexDirection: "row", alignItems: "center" },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  sellerMeta: { flex: 1 },
  sellerNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sellerName: { fontSize: 14, fontWeight: "700" },
  sellerLevelText: { fontSize: 11, color: "#6C47FF", fontWeight: "600", marginTop: 1 },
  bottomBar: { position: "absolute", bottom: 25, left: 0, right: 0, height: 72, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  chatButton: { flex: 1, height: 48, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  chatButtonText: { fontSize: 14, fontWeight: "700" },
  lightboxContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  closeLightboxButton: { position: "absolute", top: 50, right: 20, zIndex: 10, padding: 8 },
  lightboxImage: { width: "80%", height: "80%" },
});