import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import Input from "@/components/hostel/input";
import PrimaryButton from "@/components/hostel/primaryButton";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

import { useHostelStore } from "@/store/hostelStore";
import AuthHeader from "@/components/auth/authHeader";
import AuthProgress from "@/components/auth/authProgress";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

export default function HostelContactScreen() {
  const { hostel, updateField } = useHostelStore();
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View>
        <AuthHeader
          title={t("hostel.contactTitle")}
          subtitle={t("hostel.contactSubtitle")}
        />
      </View>

      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={6} totalSteps={7} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 80,
        }}
      >
        <Input
          label={t("hostel.contactPersonLabel")}
          placeholder={t("hostel.contactPersonPlaceholder")}
          value={hostel.contactName}
          onChangeText={(text: string) => updateField("contactName", text)}
        />

        <Input
          keyboardType="phone-pad"
          label={t("hostel.phoneLabel")}
          placeholder={t("hostel.phonePlaceholder")}
          value={hostel.phoneNumber}
          onChangeText={(text: string) => updateField("phoneNumber", text)}
        />

        <Input
          keyboardType="phone-pad"
          label={t("hostel.whatsappLabel")}
          placeholder={t("hostel.phonePlaceholder")}
          value={hostel.whatsapp}
          onChangeText={(text: string) => updateField("whatsapp", text)}
        />

        <Input
          keyboardType="email-address"
          autoCapitalize="none"
          label={t("hostel.emailLabel")}
          placeholder={t("hostel.emailPlaceholder")}
          value={hostel.email}
          onChangeText={(text: string) => updateField("email", text)}
        />

        <Input
          label={t("hostel.officeAddressLabel")}
          placeholder={t("hostel.officeAddressPlaceholder")}
          value={hostel.officeAddress}
          onChangeText={(text: string) => updateField("officeAddress", text)}
        />

        <Input
          label={t("hostel.contactHoursLabel")}
          placeholder={t("hostel.contactHoursPlaceholder")}
          value={hostel.contactHours}
          onChangeText={(text: string) => updateField("contactHours", text)}
        />

        {/* Preferred Contact */}

        <ThemedText className="text-lg font-bold mt-3 mb-4">
          {t("hostel.preferredContact")}
        </ThemedText>
        {/* 
        <ThemedView className="flex-row justify-between bg-transparent mb-8">

          {[
            {
              id: "phone",
              title: "Phone",
              icon: "phone",
            },
            {
              id: "whatsapp",
              title: "WhatsApp",
              icon: "whatsapp",
            },
            {
              id: "email",
              title: "Email",
              icon: "email",
            },
          ].map((item) => {

            const active =
              hostel.preferredContact === item.id;

            return (
              <ThemedView
                key={item.id}
                className="w-[31%]"
              >
                <PrimaryButton
                  title={item.title}
                  onPress={() =>
                    updateField(
                      "preferredContact",
                      item.id
                    )
                  }
                  style={{
                    backgroundColor: active
                      ? "#7C3AED"
                      : "#E5E7EB",
                  }}
                  leftIcon={
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={20}
                      color={
                        active ? "#FFF" : "#6B7280"
                      }
                    />
                  }
                />
              </ThemedView>
            );

          })}

        </ThemedView> */}
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <PrimaryButton
          title={t("action.next")}
          onPress={() => router.push("/(features)/hostel/add/preview")}
        />
      </View>
    </SafeAreaView>
  );
}
