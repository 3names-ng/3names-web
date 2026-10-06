import React from "react";
import { ScrollView, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import Input from "@/components/hostel/input";
import TextArea from "@/components/hostel/textArea";
import PrimaryButton from "@/components/hostel/primaryButton";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

import { useHostelStore } from "@/store/hostelStore";
import AuthHeader from "@/components/auth/authHeader";
import AuthProgress from "@/components/auth/authProgress";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

const RULE_KEYS = [
  {
    key: "visitorsAllowed",
    titleKey: "hostel.visitorsAllowed",
    subtitleKey: "hostel.visitorsAllowedDesc",
  },
  {
    key: "smokingAllowed",
    titleKey: "hostel.smokingAllowedRule",
    subtitleKey: "hostel.smokingAllowedDesc",
  },
  {
    key: "petsAllowed",
    titleKey: "hostel.petsAllowedRule",
    subtitleKey: "hostel.petsAllowedDesc",
  },
  {
    key: "generatorAvailable",
    titleKey: "hostel.generatorAvailable",
    subtitleKey: "hostel.generatorAvailableDesc",
  },
] as const;
type BooleanRuleKey = (typeof RULE_KEYS)[number]["key"];

export default function HostelRulesScreen() {
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
          title={t("hostel.rulesTitle")}
          subtitle={t("hostel.rulesSubtitle")}
        />
      </View>

      <ThemedView style={{ paddingHorizontal: 24 }}>
        <AuthProgress currentStep={5} totalSteps={6} />
      </ThemedView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 80,
        }}
      >
        {RULE_KEYS.map((rule) => (
          <ThemedView
            key={rule.key}
            className="rounded-3xl p-5 mb-4 flex-row items-center justify-between"
          >
            <ThemedView className="flex-1">
              <ThemedText className="text-lg font-bold">
                {t(rule.titleKey)}
              </ThemedText>

              <ThemedText className="mt-1 opacity-60">
                {t(rule.subtitleKey)}
              </ThemedText>
            </ThemedView>

            <Switch
              value={hostel[rule.key as keyof typeof hostel] as boolean}
              onValueChange={(value) =>
                updateField(rule.key as keyof typeof hostel, value)
              }
            />
          </ThemedView>
        ))}

        <Input
          label={t("hostel.curfewTime")}
          placeholder={t("hostel.curfewPlaceholder")}
          value={hostel.curfew}
          onChangeText={(text: string) => updateField("curfew", text)}
        />
        {/* <Input
          keyboardType="numeric"
          label="Minimum Months"
          placeholder="12"
          value={hostel.minimumStay}
          onChangeText={(text) => updateField("minimumStay", text)}
        /> */}

        {/* <Input
          keyboardType="numeric"
          label="Advance Payment (%)"
          placeholder="100"
          value={hostel.advancePayment}
          onChangeText={(text) => updateField("advancePayment", text)}
        /> */}

        <TextArea
          label={t("hostel.additionalRulesLabel")}
          placeholder={t("hostel.additionalRulesPlaceholder")}
          value={hostel.additionalRules}
          onChangeText={(text) => updateField("additionalRules", text)}
        />
      </ScrollView>
      <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
        <PrimaryButton
          title={t("hostel.next")}
  onPress={() => router.push("/(features)/hostel/add/preview")}
        />
      </View>
    </SafeAreaView>
  );
}
