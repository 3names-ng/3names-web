import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import SectionTitle from "@/components/hostel/sectionTitle";
import Input from "@/components/hostel/input";
import PrimaryButton from "@/components/hostel/primaryButton";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

import { useHostelStore } from "@/store/hostelStore";
import AuthHeader from "@/components/auth/authHeader";
import AuthProgress from "@/components/auth/authProgress";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export default function HostelLocationScreen() {
  const { hostel, updateField } = useHostelStore();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const annual = Number(hostel.monthlyRent || 0);

  const service = Number(hostel.serviceCharge || 0);

  const caution = Number(hostel.cautionFee || 0);

  const total = annual + service + caution;

  function next() {
    router.push("/(features)/hostel/add/roomDetails");
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
          title={t("hostel.locationTitle")}
          subtitle={t("hostel.locationSubtitle")}
        />
      </View>

      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={2} totalSteps={6} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 80,
        }}
      >
        <Input
          label={t("hostel.addressLabel")}
          placeholder={t("hostel.addressPlaceholder")}
          value={hostel.address}
          onChangeText={(text: string) => updateField("address", text)}
        />

        <Input
          label={t("hostel.cityLabel")}
          placeholder={t("hostel.cityPlaceholder")}
          value={hostel.city}
          onChangeText={(text: string) => updateField("city", text)}
        />

        <Input
          label={t("hostel.stateLabel")}
          placeholder={t("hostel.statePlaceholder")}
          value={hostel.state}
          onChangeText={(text: string) => updateField("state", text)}
        />

        <SectionTitle title={t("hostel.pricing")} />

        <Input
          keyboardType="numeric"
          label={t("hostel.pricingLabel")}
          placeholder={t("hostel.pricingPlaceholder")}
          value={hostel.monthlyRent}
          onChangeText={(text: string) => updateField("monthlyRent", text)}
        />

        <Input
          keyboardType="numeric"
          label={t("hostel.serviceChargeLabel")}
          placeholder={t("hostel.serviceChargePlaceholder")}
          value={hostel.serviceCharge}
          onChangeText={(text: string) => updateField("serviceCharge", text)}
        />

        <Input
          keyboardType="numeric"
          label={t("hostel.cautionFeeLabel")}
          placeholder={t("hostel.cautionFeePlaceholder")}
          value={hostel.cautionFee}
          onChangeText={(text: string) => updateField("cautionFee", text)}
        />

        <ThemedView className="rounded-3xl bg-violet-600 p-6 mb-8">
          <ThemedText
            style={{
              color: "#FFF",
            }}
            className="text-base"
          >
            {t("hostel.totalCost")}
          </ThemedText>

          <ThemedText
            style={{
              color: "#FFF",
            }}
            className="text-4xl font-bold mt-2"
          >
            ₦{total.toLocaleString()}
          </ThemedText>
        </ThemedView>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <PrimaryButton title={t("action.next")} onPress={next} />
      </View>
    </SafeAreaView>
  );
}