import React from "react";
import {
  StyleSheet,
  Switch,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  enabled: boolean;
  onValueChange: (value: boolean) => void;

  estimatedXp?: number;
  estimatedCoins?: number;

  allowGiftGoal?: boolean;
  giftGoal?: number;
  currentGiftCoins?: number;
}

export default function GiftSwitch({
  enabled,
  onValueChange,
}: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

 
  return (
    <View style={[styles.outerContainer, { borderBottomColor: colors.border }]}>
      {/* Main Switch Row */}
      <View style={styles.headerRow}>
        {/* Left Side: Pink Gift Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="gift-outline"
            size={22}
            color="#EC4899"
          />
        </View>

        {/* Middle: Title & Subtitle */}
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>{t("giftSwitch.title")}</ThemedText>
          <ThemedText style={styles.subtitle}>
            {t("giftSwitch.subtitle")}
          </ThemedText>
        </View>

        {/* Right Side: Toggle Switch */}
        <Switch
          value={enabled}
          onValueChange={onValueChange}
          thumbColor="#FFFFFF"
          trackColor={{
            false: "#CBD5E1",
            true: "#7C3AED",
          }}
        />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1, 
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 30,
    alignItems: "flex-start",
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  expandedContent: {
    marginTop: 14,
    paddingLeft: 30, // Aligns beautiful indentations underneath the header title
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 10,
    padding: 10,
  },
  infoIcon: {
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    color: "#2563EB",
    fontSize: 12.5,
    lineHeight: 18,
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  rewardCard: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  rewardDetails: {
    marginLeft: 8,
  },
  rewardTitle: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  rewardValue: {
    fontWeight: "600",
    fontSize: 13,
    marginTop: 1,
  },
  goalSection: {
    marginTop: 16,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  goalAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7C3AED",
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    backgroundColor: "#7C3AED",
  },
  goalButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7C3AED",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  goalButtonText: {
    color: "#FFF",
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
  },
});