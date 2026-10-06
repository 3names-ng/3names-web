import React from "react";
import { ScrollView, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import PrimaryButton from "@/components/hostel/primaryButton";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

import { useHostelStore } from "@/store/hostelStore";
import AuthHeader from "@/components/auth/authHeader";
import AuthProgress from "@/components/auth/authProgress";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/translations";

const AMENITY_IDS = [
  "wifi", "electricity", "water", "security", "cctv",
  "parking", "laundry", "kitchen", "wardrobe", "study",
  "generator", "furnished", "aircondition", "balcony", "tv",
] as const;

const AMENITY_ICONS: Record<string, string> = {
  wifi: "wifi",
  electricity: "lightning-bolt",
  water: "water",
  security: "shield-check",
  cctv: "cctv",
  parking: "car",
  laundry: "washing-machine",
  kitchen: "silverware-fork-knife",
  wardrobe: "wardrobe",
  study: "desk",
  generator: "engine",
  furnished: "sofa",
  aircondition: "air-conditioner",
  balcony: "balcony",
  tv: "television",
};

const AMENITY_KEY_MAP: Record<string, TranslationKey> = {
  wifi: "hostel.wifi",
  electricity: "hostel.electricity247",
  water: "hostel.runningWater",
  security: "hostel.security",
  cctv: "hostel.cctv",
  parking: "hostel.parking",
  laundry: "hostel.laundry",
  kitchen: "hostel.kitchen",
  wardrobe: "hostel.wardrobe",
  study: "hostel.studyArea",
  generator: "hostel.generator",
  furnished: "hostel.fullyFurnished",
  aircondition: "hostel.airConditioner",
  balcony: "hostel.balcony",
  tv: "hostel.smartTv",
};

export default function AmenitiesScreen() {
  const { hostel, updateField } = useHostelStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const selected = hostel.amenities ?? [];

  function toggleAmenity(id: string) {
    if (selected.includes(id)) {
      updateField(
        "amenities",
        selected.filter((x) => x !== id),
      );
    } else {
      updateField("amenities", [...selected, id]);
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View>
        <AuthHeader
          title={t("hostel.amenitiesTitle")}
          subtitle={t("hostel.amenitiesSubtitle")}
        />
      </View>

      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={4} totalSteps={6} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 90,
        }}
      >
        <ThemedView className="flex-row flex-wrap justify-between">
          {AMENITY_IDS.map((id) => {
            const active = selected.includes(id);

            return (
              <Pressable
                key={id}
                onPress={() => toggleAmenity(id)}
                className="w-[48%] rounded-3xl p-5 mb-4 items-center"
                style={{
                  backgroundColor: active ? "#7C3AED" : "#F8FAFC",
                  borderWidth: 1,
                  borderColor: active ? "#7C3AED" : "#E5E7EB",
                }}
              >
                <MaterialCommunityIcons
                  name={AMENITY_ICONS[id] as any}
                  size={34}
                  color={active ? "#FFF" : "#7C3AED"}
                />

                <ThemedText
                  className="mt-3 text-center font-semibold"
                  style={{
                    color: active ? "#FFF" : "#111827",
                  }}
                >
                  {t(AMENITY_KEY_MAP[id])}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <PrimaryButton
          title={t("action.next")}
          onPress={() => router.push("/(features)/hostel/add/rules")}
        />
      </View>
    </SafeAreaView>
  );
}
