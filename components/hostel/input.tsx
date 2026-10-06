import React from "react";
import { TextInput, View, TextInputProps } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "none",
  editable = true,
  error,
  ...props
}: Props) {
  const { colors } = useTheme();

  return (
    <View className="mb-4">
      <ThemedText
        style={{
          marginBottom: 8,
          fontWeight: "700",
        }}
      >
        {label}
      </ThemedText>

      <ThemedView
        style={{
          borderWidth: 1,
          borderColor: error ? "#EF4444" : colors.border,
          backgroundColor: colors.card,
        }}
        className="rounded-3xl"
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          className="px-5 py-4 text-base"
          style={{
            color: colors.text,
          }}
          {...props}
        />
      </ThemedView>

      {error ? (
        <ThemedText className="mt-2 text-sm text-red-500">{error}</ThemedText>
      ) : null}
    </View>
  );
}
