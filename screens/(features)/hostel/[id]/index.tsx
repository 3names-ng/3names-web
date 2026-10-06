import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";
import { hostelService } from "@/service/hostel.service";
import { showError, showSuccess } from "@/components/ui/toast";
import { useTheme } from "@/hooks/useTheme";
import { ThemedView } from "@/components/ui/ThemedView";
import { useAuthStore } from "@/store/authStore";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { ListingDetailSkeleton } from "@/components/ui/listingSkeleton";
import ReportContentSheet from "@/components/ui/reportContentSheet";
import { useSyncSignal } from "@/hooks/useSyncSignal";
import { syncKeys } from "@/store/syncStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Dynamic Amenity Icon & Label Lookup Map
const AMENITY_MAP: Record<string, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  wifi: { label: "Wi-Fi", icon: "wifi" },
  parking: { label: "Parking", icon: "truck" },
  kitchen: { label: "Kitchen", icon: "coffee" },
  study: { label: "Study", icon: "book-open" },
  laundry: { label: "Laundry", icon: "repeat" },
  furnished: { label: "Furnished", icon: "home" },
  wardrobe: { label: "Wardrobe", icon: "box" },
  balcony: { label: "Balcony", icon: "sun" },
  generator: { label: "Generator", icon: "zap" },
  electricity: { label: "Electricity", icon: "zap" },
  water: { label: "Water", icon: "droplet" },
  security: { label: "Security", icon: "shield" },
};

export default function HostelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showReport, setShowReport] = useState(false);
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);

  const [hostel, setHostel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [togglingListing, setTogglingListing] = useState(false);

  // Refetch whenever the screen regains focus, so returning from the edit
  // screen after a successful update shows the new data immediately instead
  // of the stale pre-edit state.
  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchHostelDetail();
      }
    }, [id]),
  );

  async function fetchHostelDetail() {
    try {
      setLoading(true);
      const data = await hostelService.getHostelById(id as string);
     
      setHostel(data);
      setIsLiked(Array.isArray(data?.likes) && data.likes.length > 0);
    } catch (e: any) {
      console.error("Error fetching hostel details:", e);
      showError("Failed to load hostel details.", "Error");
    } finally {
      setLoading(false);
    }
  }

  // The edit screen saves in the background after navigating back, so the
  // focus refetch above can land before the update commits. Refetch again
  // once the write actually settles.
  useSyncSignal(id ? syncKeys.hostel(id) : undefined, fetchHostelDetail);

  // Determine if the logged-in user is the seller
  const sellerId = hostel?.sellerId || hostel?.seller?._id || hostel?.userId;
  const seller = hostel?.seller || hostel?.user;
  const currentUserId =  user?.id;
  const isOwner = Boolean(currentUserId && sellerId && currentUserId === sellerId);
  const isClosed = hostel?.status !== "available";

  async function performToggleListing(closing: boolean) {
    if (!id) return;
    try {
      setTogglingListing(true);
      const response = closing
        ? await hostelService.markAsUnavailable(id as string)
        : await hostelService.markAsAvailable(id as string);
      const updated = response?.data || response;
      setHostel((prev: any) => ({
        ...prev,
        status: updated?.status ?? (closing ? "unavailable" : "available"),
        isAvailable: updated?.isAvailable ?? !closing,
      }));
      showSuccess(closing ? "Listing closed successfully" : "Listing reopened successfully");
    } catch (error) {
      showError(`Failed to ${closing ? "close" : "reopen"} listing`, "Error");
    } finally {
      setTogglingListing(false);
    }
  }

  function handleCloseListing() {
    if (isClosed) {
      performToggleListing(false);
      return;
    }
    Alert.alert(
      "Close Listing",
      "Are you sure you want to close this listing? It will no longer be visible to students until you reopen it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close Listing",
          style: "destructive",
          onPress: () => performToggleListing(true),
        },
      ]
    );
  }


  if (loading) {
    return <ListingDetailSkeleton imageHeight={288} onBack={() => router.back()} />;
  }

  if (!hostel) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-6">
        <ThemedText className="text-gray-500 text-lg mb-4 text-center">
          Hostel listing not found.
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          className="bg-[#6C47FF] px-6 py-3 rounded-full"
        >
          <ThemedText className="text-white font-semibold">Go Back</ThemedText>
        </Pressable>
      </SafeAreaView>
    );
  }

  const photos: string[] = hostel.imageUrls || hostel.photos || [];
  const monthlyRent = parseFloat(hostel.monthlyRent || hostel.price || "0");
  const serviceCharge = parseFloat(hostel.serviceCharge || "0");
  const cautionFee = parseFloat(hostel.cautionFee || "0");
  const totalCost = monthlyRent + serviceCharge + cautionFee;

  const hostelTitle = hostel.hostelName || hostel.title || "Hostel Listing";
  const schoolName = hostel.school?.name || "University";
  const fullAddress = [hostel.address, hostel.city, hostel.state]
    .filter(Boolean)
    .join(", ");

  const sellerName =
    hostel.contactName ||
    `${hostel.seller?.firstName || ""} ${hostel.seller?.lastName || ""}`.trim() ||
    "Property Owner";

  const amenitiesList: string[] = Array.isArray(hostel.amenities)
    ? hostel.amenities
    : [];

  return (
    <ThemedView style={{ flex: 1, backgroundColor: colors.background }}>
      <ReportContentSheet
        visible={showReport}
        targetType="hostel_listing"
        targetId={hostel?.id ?? id}
        subject="listing"
        onClose={() => setShowReport(false)}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header Photo Gallery Carousel */}
        <ThemedView className="relative w-full h-72">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              if (slide !== activeImageIndex) {
                setActiveImageIndex(slide);
              }
            }}
            scrollEventThrottle={16}
          >
            {photos.length > 0 ? (
              photos.map((url: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={{ width: SCREEN_WIDTH, height: 288, resizeMode: "cover" }}
                />
              ))
            ) : (
              <ThemedView
                style={{ width: SCREEN_WIDTH, height: 288 }}
                className="items-center justify-center bg-gray-100"
              >
                <Feather name="image" size={48} color="#9CA3AF" />
              </ThemedView>
            )}
          </ScrollView>

          {/* Floating Action Button Header */}
          <SafeAreaView className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5 pt-3">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-md shadow-black/10"
            >
              <Feather name="chevron-left" size={24} color="#111827" />
            </Pressable>

            {isOwner ? (
              <Pressable
                onPress={() => router.push(`/(features)/hostel/${id}/edit` as any)}
                className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-md shadow-black/10"
              >
                <Feather name="edit-2" size={18} color="#111827" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setShowReport(true)}
                accessibilityLabel="Report listing"
                className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-md shadow-black/10"
              >
                <Feather name="flag" size={18} color="#111827" />
              </Pressable>
            )}
          </SafeAreaView>

          {/* Floating Image Badge Counter */}
          <ThemedView style={{ borderWidth:1, borderColor: colors.border }} className="absolute bottom-4 right-5 px-3.5 py-1.5 rounded-full flex-row items-center space-x-1.5">
            <Feather name="image" size={13} color="#FFF" />
            <ThemedText className="text-white text-xs font-semibold ml-1">
              {photos.length > 0 ? activeImageIndex + 1 : 0} / {photos.length || 1}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Main Content Details Body */}
        <ThemedView className="px-5 pt-5 gap-y-6">
          <ThemedView className="flex-row items-start justify-between gap-x-4">
            <ThemedView className="flex-1 mt-4">
              <ThemedText className="text-2xl font-bold text-gray-900 leading-tight">
                {hostelTitle}
              </ThemedText>

              <ThemedView className="flex-row items-center space-x-2 mt-4">
                <Feather name="home" size={14} color="#FBBF24" />
                <ThemedText className="text-sm text-gray-500 font-medium ml-1">
                  {schoolName}
                </ThemedText>
              </ThemedView>

              <ThemedView className="flex-row items-center space-x-1.5 mt-4">
                <Ionicons name="location" size={16} color="#6C47FF" />
                <ThemedText className="text-xs text-gray-500 flex-1 ml-1 leading-4">
                  {fullAddress}
                </ThemedText>
              </ThemedView>
            </ThemedView>

            <ThemedView className="items-end mt-6">
              <ThemedText className="text-2xl font-extrabold text-gray-900">
                ₦{monthlyRent.toLocaleString()}
              </ThemedText>
              <ThemedText className="text-xs text-[#6C47FF] font-medium mt-1">
                per annual
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Quick Features Specification Card */}
          <ThemedView
            style={{ borderWidth: 1, borderColor: colors.border }}
            className="flex-row items-center justify-between rounded-2xl p-4 py-4 mt-6"
          >
            <ThemedView className="flex-1 items-center px-1">
              <Feather name="box" size={18} color="#6C47FF" />
              <ThemedText className="text-[10px] text-gray-400 mt-2 font-medium">
                Room Type
              </ThemedText>
              <ThemedText className="text-xs font-bold text-gray-900 mt-1 text-center" numberOfLines={1}>
                {hostel.roomType || "Single"}
              </ThemedText>
            </ThemedView>

            <ThemedView className="w-[1px] h-8 bg-gray-200" />

            <ThemedView className="flex-1 items-center px-1">
              <Feather name="users" size={18} color="#6C47FF" />
              <ThemedText className="text-[10px] text-gray-400 mt-2 font-medium">
                Capacity
              </ThemedText>
              <ThemedText className="text-xs font-bold text-gray-900 mt-1 text-center" numberOfLines={1}>
                {hostel.capacity ? `${hostel.capacity} Person` : "N/A"}
              </ThemedText>
            </ThemedView>

            <ThemedView className="w-[1px] h-8 bg-gray-200" />

            <ThemedView className="flex-1 items-center px-1">
              <Ionicons name="people-outline" size={18} color="#6C47FF" />
              <ThemedText className="text-[10px] text-gray-400 mt-2 font-medium">
                Gender
              </ThemedText>
              <ThemedText className="text-xs font-bold text-gray-900 mt-1 text-center capitalize" numberOfLines={1}>
                {hostel.gender || "Mixed"}
              </ThemedText>
            </ThemedView>

            <ThemedView className="w-[1px] h-8 bg-gray-200" />

            <ThemedView className="flex-1 items-center px-1">
              <Feather name="sidebar" size={18} color="#6C47FF" />
              <ThemedText className="text-[10px] text-gray-400 mt-2 font-medium">
                Available
              </ThemedText>
              <ThemedText className="text-xs font-bold text-gray-900 mt-1 text-center" numberOfLines={1}>
                {hostel.availableRooms ? `${hostel.availableRooms} Rooms` : "Available"}
              </ThemedText>
            </ThemedView>

            <ThemedView className="w-[1px] h-8 bg-gray-200" />

            <ThemedView className="flex-1 items-center px-1">
              <Feather name="shield" size={18} color="#6C47FF" />
              <ThemedText className="text-[10px] text-gray-400 mt-2 font-medium">
                Status
              </ThemedText>
              <ThemedText className="text-xs font-bold text-emerald-600 mt-1 text-center capitalize" numberOfLines={1}>
                {hostel.status || "Active"}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* About This Hostel */}
          <ThemedView className="gap-y-2 mt-6">
            <ThemedText className="text-base font-bold text-gray-900">
              About this hostel
            </ThemedText>
            <ThemedText
              numberOfLines={showFullDescription ? undefined : 3}
              className="text-sm text-gray-600 leading-6"
            >
              {hostel.description?.trim() || "No description provided."}
            </ThemedText>
            {hostel.description && hostel.description.length > 100 && (
              <Pressable
                onPress={() => setShowFullDescription(!showFullDescription)}
                className="pt-1"
              >
                <ThemedText className="text-sm font-semibold text-[#6C47FF]">
                  {showFullDescription ? "Read less" : "Read more"}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>

          {/* Amenities Section */}
          {amenitiesList.length > 0 && (
            <ThemedView className="gap-y-3 mt-6">
              <ThemedText className="text-base font-bold text-gray-900 mb-3">
                Amenities
              </ThemedText>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-5"
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {amenitiesList.map((key) => {
                  const meta = AMENITY_MAP[key.toLowerCase()] || {
                    label: key,
                    icon: "check-circle",
                  };
                  return (
                    <ThemedView
                      key={key}
                      style={{ borderWidth: 1, borderColor: colors.border }}
                      className="w-20 h-20 rounded-2xl items-center justify-center mr-3 p-2"
                    >
                      <Feather name={meta.icon} size={22} color="#6C47FF" />
                      <ThemedText className="text-xs text-gray-700 font-medium mt-2 capitalize text-center" numberOfLines={1}>
                        {meta.label}
                      </ThemedText>
                    </ThemedView>
                  );
                })}
              </ScrollView>
            </ThemedView>
          )}

          {/* Pricing Breakdown Card */}
          <ThemedView className="gap-y-3 mt-6">
            <ThemedText className="text-base font-bold text-gray-900 mb-3">
              Pricing Details
            </ThemedText>

            <ThemedView
              style={{ borderWidth: 1, borderColor: colors.border }}
              className="rounded-2xl p-4 gap-y-3"
            >
              <ThemedView className="flex-row justify-between items-center mb-2">
                <ThemedText className="text-xs text-gray-600">Monthly Rent</ThemedText>
                <ThemedText className="text-xs font-bold text-gray-900">
                  ₦{monthlyRent.toLocaleString()}
                </ThemedText>
              </ThemedView>

              <ThemedView className="flex-row justify-between items-center mb-2">
                <ThemedText className="text-xs text-gray-600">Service Charge</ThemedText>
                <ThemedText className="text-xs font-bold text-gray-900">
                  ₦{serviceCharge.toLocaleString()}
                </ThemedText>
              </ThemedView>

              <ThemedView className="flex-row justify-between items-center mb-2">
                <ThemedText className="text-xs text-gray-600">Caution Fee</ThemedText>
                <ThemedText className="text-xs font-bold text-gray-900">
                  ₦{cautionFee.toLocaleString()}
                </ThemedText>
              </ThemedView>

              <ThemedView
                style={{ borderColor: colors.border }}
                className="border-t border-dashed pt-3 mt-1 flex-row justify-between items-center"
              >
                <ThemedText className="text-xs font-bold text-[#6C47FF]">
                  Total (Payable)
                </ThemedText>
                <ThemedText className="text-base font-extrabold text-[#6C47FF]">
                  ₦{totalCost.toLocaleString()}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* Side-by-Side Cards: Rules & Contact Owner */}
          <ThemedView className="flex-row justify-between gap-x-3 mt-6">
            {/* Rules & Policies */}
            <ThemedView
              style={{ borderWidth: 1, borderColor: colors.border }}
              className="flex-1 rounded-2xl p-4 shadow-sm justify-between gap-y-3 mr-3"
            >
              <ThemedText className="text-sm font-bold text-gray-900 mb-2">
                Rules & Policies
              </ThemedText>

              <ThemedView className="gap-y-2.5">
                <ThemedView className="flex-row items-center">
                  <Feather
                    name={hostel.visitorsAllowed ? "check-circle" : "x-circle"}
                    size={14}
                    color={hostel.visitorsAllowed ? "#10B981" : "#EF4444"}
                  />
                  <ThemedText className="text-xs text-gray-700 font-medium ml-2">
                    {hostel.visitorsAllowed ? "Visitors Allowed" : "No Visitors"}
                  </ThemedText>
                </ThemedView>

                <ThemedView className="flex-row items-center">
                  <Feather
                    name={!hostel.smokingAllowed ? "check-circle" : "x-circle"}
                    size={14}
                    color={!hostel.smokingAllowed ? "#10B981" : "#EF4444"}
                  />
                  <ThemedText className="text-xs text-gray-700 font-medium ml-2">
                    {hostel.smokingAllowed ? "Smoking Allowed" : "No Smoking"}
                  </ThemedText>
                </ThemedView>

                <ThemedView className="flex-row items-center">
                  <Feather
                    name={!hostel.petsAllowed ? "check-circle" : "x-circle"}
                    size={14}
                    color={!hostel.petsAllowed ? "#10B981" : "#EF4444"}
                  />
                  <ThemedText className="text-xs text-gray-700 font-medium ml-2">
                    {hostel.petsAllowed ? "Pets Allowed" : "No Pets"}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>

            {/* Contact Owner Card */}
            <ThemedView
              style={{ borderWidth: 1, borderColor: colors.border }}
              className="flex-1 rounded-2xl p-4 shadow-sm justify-between gap-y-3"
            >
              <ThemedText className="text-sm font-bold text-gray-900">
                {isOwner ? "Owner (You)" : "Contact Owner"}
              </ThemedText>

              <ThemedView className="flex-row items-center gap-x-2.5">
                <ProfileFrame
                  frameId={hostel.seller?.profileFrame}
                  uri={hostel.seller?.profilePictureUrl}
                  size={40}
                  initial={sellerName?.[0]?.toUpperCase()}
                />
                <ThemedView className="flex-1 mr-1.5">
                  <ThemedText className="text-xs font-bold text-gray-900" numberOfLines={1}>
                    {sellerName}
                  </ThemedText>
                  <ThemedText className="text-[10px] text-gray-400 mt-0.5">
                    {isOwner ? "Listing Creator" : "Verified Host"}
                  </ThemedText>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <ThemedView className="absolute bottom-0 left-0 right-0 border-t border-gray-100 p-4 px-5 pb-10 flex-row items-center shadow-lg shadow-black/10">
        {isOwner ? (
          <ThemedView className="flex-1 flex-row items-center gap-x-3">
            <Pressable
              disabled={togglingListing}
              onPress={handleCloseListing}
              style={{ opacity: togglingListing ? 0.6 : 1 }}
              className={`flex-1 h-12 rounded-xl border flex-row items-center justify-center space-x-2 active:opacity-80 ${
                isClosed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
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

          </ThemedView>
        ) : (
          <Pressable
          onPress={() => {
                if (sellerId) {
                  router.push({
                    pathname: "/chatScreen",
                    params: {
                      id: sellerId,
                      isUserId: "true",
                      user: JSON.stringify(seller),
                    },
                  });
                }
              }}
            // onPress={()=>}
            style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.primary }}
            className="flex-1 h-12 rounded-xl flex-row items-center justify-center space-x-2 active:opacity-90"
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
            <ThemedText style={{ color: "#FFF" }} className=" font-bold text-sm ml-2">
              Message Owner
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </ThemedView>
  );
}