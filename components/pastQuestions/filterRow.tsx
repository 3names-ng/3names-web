import React, { useState } from "react";
import { TouchableOpacity } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

export default function FilterRow() {
  const { colors } = useTheme();

  const [course] = useState("Course");
  const [level] = useState("Level");

  const cardStyle = {
    backgroundColor: colors.card,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  };

  return (
    <ThemedView className="mb-6 flex-row items-center bg-transparent">

      {/* Course */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="mr-3 h-14 flex-1 flex-row items-center justify-between rounded-2xl px-4"
        style={cardStyle}
      >
        <ThemedText className="text-base font-medium">
          {course}
        </ThemedText>

        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.text}
        />
      </TouchableOpacity>

      {/* Level */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="mr-3 h-14 flex-1 flex-row items-center justify-between rounded-2xl px-4"
        style={cardStyle}
      >
        <ThemedText className="text-base font-medium">
          {level}
        </ThemedText>

        <Ionicons
          name="chevron-down"
          size={18}
          color={colors.text}
        />
      </TouchableOpacity>

      {/* Filter */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="h-14 w-14 items-center justify-center rounded-2xl"
        style={cardStyle}
      >
        <Feather
          name="sliders"
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>

    </ThemedView>
  );
}