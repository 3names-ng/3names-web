import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  text?: string;
}

export default function AuthDivider({
  text = "OR CONTINUE WITH",
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 28,
      }}
    >
      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        }}
      />

      <ThemedText
        style={{
          marginHorizontal: 14,
          color: colors.secondary,
          fontSize: 13,
          fontWeight: "600",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        {text}
      </ThemedText>

      <View
        style={{
          flex: 1,
          height: 1,
          backgroundColor: colors.border,
        }}
      />
    </View>
  );
}