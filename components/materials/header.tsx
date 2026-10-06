import React from "react";
import { TouchableOpacity } from "react-native";

import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

export default function Header() {
  const { colors } = useTheme();

  return (
    <ThemedView
      className="flex-row items-center justify-between px-5 py-4"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <ThemedText
        color="text"
        className="text-3xl font-bold"
      >
        Study Materials
      </ThemedText>

      <ThemedView className="flex-row items-center gap-3 bg-transparent">
        <TouchableOpacity
          activeOpacity={0.8}
          className="h-11 w-11 items-center justify-center rounded-full shadow-sm"
          style={{
            backgroundColor: colors.card,
            elevation: 2,
          }}
        >
          <Feather
            name="search"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="h-11 w-11 items-center justify-center rounded-full shadow-sm"
          style={{
            backgroundColor: colors.card,
            elevation: 2,
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}