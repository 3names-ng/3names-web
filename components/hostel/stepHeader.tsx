import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  step: number;
  title: string;
  subtitle?: string;
}

export default function StepHeader({ step, title, subtitle }: Props) {
  const { colors } = useTheme();

  return (
    <View className="mb-6">
      <ThemedText
        style={{
          color: colors.secondary,
          fontSize: 15,
          fontWeight: "700",
          marginBottom: 6,
        }}
      >
        Step {step}
      </ThemedText>

      <ThemedText
        style={{
          color: colors.text,
          fontSize: 22,
          fontWeight: "800",
        }}
      >
        {title}
      </ThemedText>

      {subtitle ? (
        <ThemedText
          className="mt-2"
          style={{
            color: colors.secondary,
            fontSize: 15,
          }}
        >
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}
