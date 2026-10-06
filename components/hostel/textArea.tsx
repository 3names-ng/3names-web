import React from "react";
import { TextInput, View, TextInputProps } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export default function TextArea({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
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
          editable={editable}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="px-5 py-4 text-base"
          style={{
            color: colors.text,
            minHeight: 140,
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
