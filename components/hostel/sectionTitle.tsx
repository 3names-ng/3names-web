import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  subtitle?: string;
}

export default function SectionTitle({
  title,
  subtitle,
}: Props) {
  const { colors } = useTheme();

  return (
    <View className="mb-4">
      <ThemedText
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: colors.text,
        }}
      >
        {title}
      </ThemedText>

      {subtitle ? (
        <ThemedText
          className="mt-1"
          style={{
            color: colors.secondary,
          }}
        >
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}
