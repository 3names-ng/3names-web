import React, { useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import PrimaryButton from "@/components/hostel/primaryButton";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useHostelStore } from "@/store/hostelStore";
import AuthHeader from "@/components/auth/authHeader";
import AuthProgress from "@/components/auth/authProgress";
import { useTheme } from "@/hooks/useTheme";
import { showError, showSuccess } from "@/components/ui/toast";
import { hostelService } from "@/service/hostel.service";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateRestriction } from "@/hooks/useCreateRestriction";

export default function PreviewHostelScreen() {
  const { hostel, reset } = useHostelStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { isRestricted, guardCreate } = useCreateRestriction();

async function publishHostel() {
  if (!guardCreate("Creating new hostel listings is disabled while your account is restricted.")) {
    return;
  }
  try {
    setLoading(true);

    const payload = {
      hostelName: hostel.hostelName,
      description: hostel.description,
      address: hostel.address,
      city: hostel.city,
      state: hostel.state,
      school: hostel.school,
      monthlyRent: Number(hostel.monthlyRent) || 0,
      serviceCharge: Number(hostel.serviceCharge) || 0,
      cautionFee: Number(hostel.cautionFee) || 0,
      roomType: hostel.roomType,
      gender: hostel.gender,
      capacity: Number(hostel.capacity) || 1,
      availableRooms: Number(hostel.availableRooms) || 1,
      amenities: hostel.amenities,
      curfew: hostel.curfew,
      visitorsAllowed: hostel.visitorsAllowed,
      petsAllowed: hostel.petsAllowed,
      smokingAllowed: hostel.smokingAllowed,
      lookingForRoommate: hostel.lookingForRoommate,
      contactName: hostel.contactName,
      phoneNumber: hostel.phoneNumber,
      whatsapp: hostel.whatsapp,
      email: hostel.email,
      photos: hostel.photos,
    };

    await hostelService.createHostel(payload);

    showSuccess(t("hostel.publishSuccess"), t("hostel.publishSuccessTitle"));
    reset();

    if (router.canDismiss()) {
      router.dismissAll();
    }
    
    // Redirects to main hostel list
    router.replace("/(features)/hostel");
  } catch (e: any) {
    console.error("Publishing error:", e);
    const apiMessage = e?.response?.data?.message;
    showError(
      Array.isArray(apiMessage) ? apiMessage[0] : apiMessage || t("hostel.publishError"),
      t("hostel.publishErrorTitle")
    );
  } finally {
    setLoading(false);
  }
}

  const total =
    Number(hostel.monthlyRent || 0) +
    Number(hostel.serviceCharge || 0) +
    Number(hostel.cautionFee || 0);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View>
        <AuthHeader
          title={t("hostel.previewTitle")}
          subtitle={t("hostel.previewSubtitle")}
        />
      </View>

      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={6} totalSteps={6} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
      >
        {/* Images */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {hostel.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={{
                width: 390,
                height: 260,
              }}
            />
          ))}
        </ScrollView>

        {/* Main Details */}
        <ThemedView className="p-5">
          {/* Hostel Header */}
          <ThemedView className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 mb-5">
            <ThemedText className="text-3xl font-bold">
              {hostel.hostelName}
            </ThemedText>

            <ThemedText className="mt-2 text-base opacity-70">
              {hostel.description}
            </ThemedText>
          </ThemedView>

          {/* Location */}
          <ThemedView className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 mb-5">
            <ThemedText className="text-xl font-bold mb-3">{t("hostel.previewLocation")}</ThemedText>
            <ThemedText>{hostel.address}</ThemedText>
            <ThemedText>
              {hostel.city}, {hostel.state}
            </ThemedText>
            <ThemedText className="mt-2 text-violet-400 font-medium">
              {t("hostel.previewNear", { school: hostel.school })}
            </ThemedText>
          </ThemedView>

          {/* Price Breakdown */}
          <ThemedView className="rounded-3xl bg-violet-600 p-5 mb-5">
            <ThemedText className="text-lg text-white">{t("hostel.previewMonthlyRent")}</ThemedText>
            <ThemedText className="text-4xl font-bold mt-2 text-white">
              ₦{Number(hostel.monthlyRent).toLocaleString()}
            </ThemedText>

            <ThemedView className="mt-5 bg-transparent border-t border-white/20 pt-4">
              <ThemedText className="text-white">
                {t("hostel.previewServiceCharge")} ₦{Number(hostel.serviceCharge || 0).toLocaleString()}
              </ThemedText>
              <ThemedText className="text-white mt-1">
                {t("hostel.previewCautionFee")} ₦{Number(hostel.cautionFee || 0).toLocaleString()}
              </ThemedText>
              <ThemedText className="font-bold text-lg mt-3 text-white">
                {t("hostel.previewTotal")} ₦{total.toLocaleString()}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Room Details */}
          <ThemedView className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 mb-5">
            <ThemedText className="text-xl font-bold mb-4">
              {t("hostel.previewRoomDetails")}
            </ThemedText>
            <ThemedText>{t("hostel.previewRoomType", { type: hostel.roomType })}</ThemedText>
            <ThemedText>{t("hostel.previewGender", { gender: hostel.gender })}</ThemedText>
            <ThemedText>{t("hostel.previewCapacity", { count: hostel.capacity })}</ThemedText>
            <ThemedText>
              {t("hostel.previewAvailableRooms", { count: hostel.availableRooms })}
            </ThemedText>
          </ThemedView>

          {/* Amenities */}
          <ThemedView className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 mb-5">
            <ThemedText className="text-xl font-bold mb-4">
              {t("hostel.previewAmenities")}
            </ThemedText>
            <ThemedView className="flex-row flex-wrap bg-transparent">
              {hostel.amenities.map((item) => (
                <View
                  key={item}
                  className="px-4 py-2 rounded-full bg-violet-600/20 border border-violet-500/40 mr-2 mb-2"
                >
                  <ThemedText className="text-violet-300">{item}</ThemedText>
                </View>
              ))}
            </ThemedView>
          </ThemedView>

          {/* Rules */}
          <ThemedView className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 mb-5">
            <ThemedText className="text-xl font-bold mb-3">{t("hostel.previewRules")}</ThemedText>
            <ThemedText>{t("hostel.previewCurfew", { value: hostel.curfew || t("hostel.none") })}</ThemedText>
            <ThemedText>
              {t("hostel.previewVisitors", { value: hostel.visitorsAllowed ? t("hostel.allowed") : t("hostel.notAllowed") })}
            </ThemedText>
            <ThemedText>
              {t("hostel.previewPets", { value: hostel.petsAllowed ? t("hostel.allowed") : t("hostel.notAllowed") })}
            </ThemedText>
            <ThemedText>
              {t("hostel.previewSmoking", { value: hostel.smokingAllowed ? t("hostel.allowed") : t("hostel.notAllowed") })}
            </ThemedText>
          </ThemedView>

          {/* Contact Details */}
          {/* <ThemedView className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 mb-10">
            <ThemedText className="text-xl font-bold mb-3">Contact</ThemedText>
            <ThemedText>{hostel.contactName}</ThemedText>
            <ThemedText>{hostel.phoneNumber}</ThemedText>
            {hostel.whatsapp && <ThemedText>WhatsApp: {hostel.whatsapp}</ThemedText>}
            <ThemedText>{hostel.email}</ThemedText>
          </ThemedView> */}
        </ThemedView>
      </ScrollView>

      {isRestricted && (
        <ThemedView style={{ marginHorizontal: 20, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.dangerLight }}>
          <ThemedText style={{ fontSize: 12, fontWeight: "600", textAlign: "center", color: colors.danger }}>
            New listings are disabled while your account is restricted
          </ThemedText>
        </ThemedView>
      )}

      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <PrimaryButton
          title={loading ? t("hostel.publishing") : t("hostel.publishHostel")}
          loading={loading}
          onPress={publishHostel}
          disabled={isRestricted}
        />
      </View>
    </SafeAreaView>
  );
}