import React from "react";
import { TouchableOpacity, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  subtitle?: string;
  action?: string;
  onPress?: () => void;
}

export default function SectionHeader({
  title,
  subtitle,
  action = "See All",
  onPress,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginTop: 28,
        marginBottom: 16,
        marginHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Left */}

      <View style={{ flex: 1 }}>
        <ThemedText
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: colors.text,
          }}
        >
          {title}
        </ThemedText>

        {subtitle && (
          <ThemedText
            style={{
              marginTop: 4,
              fontSize: 14,
              color: colors.secondary ?? "#9CA3AF",
            }}
          >
            {subtitle}
          </ThemedText>
        )}
      </View>

      {/* Right */}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <ThemedText
          style={{
            color: "#7C3AED",
            fontWeight: "700",
            fontSize: 15,
          }}
        >
          {action}
        </ThemedText>

        <Ionicons
          name="chevron-forward"
          size={18}
          color="#7C3AED"
          style={{ marginLeft: 2 }}
        />
      </TouchableOpacity>
    </View>
  );
}