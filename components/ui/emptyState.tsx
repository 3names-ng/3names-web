import React from "react";
import { TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  buttonText?: string;
  onPress?: () => void;
}

export default function EmptyState({
  title = "No data found",
  message = "There is nothing to display here yet.",
  icon = "file-tray-outline",
  buttonText,
  onPress,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <ThemedView className="flex-1 items-center justify-center px-6 py-10 bg-transparent">

      {/* Icon */}
      <ThemedView
        className="h-20 w-20 items-center justify-center rounded-full"
        style={{
          backgroundColor: colors.primaryLight,
        }}
      >
        <Ionicons
          name={icon}
          size={38}
          color={colors.primary}
        />
      </ThemedView>


      {/* Text */}
      <ThemedText className="mt-5 text-center text-xl font-bold">
        {title}
      </ThemedText>

      <ThemedText
        color="muted"
        className="mt-2 max-w-[280px] text-center text-sm"
      >
        {message}
      </ThemedText>


      {/* Button optional */}
      {buttonText && (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          className="mt-6 rounded-xl px-6 py-3"
          style={{
            backgroundColor: colors.primary,
          }}
        >
          <ThemedText
            className="font-bold"
            style={{
              color: "#FFFFFF",
            }}
          >
            {buttonText}
          </ThemedText>
        </TouchableOpacity>
      )}

    </ThemedView>
  );
}