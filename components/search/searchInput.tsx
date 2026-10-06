import React from "react";
import { TextInput, View, TextInputProps, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props extends TextInputProps {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export default function SearchInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = "Search....",
  autoFocus = false,
  ...props
}: Props) {
  const { colors } = useTheme();

  return (
    <ThemedView
      className="flex-row items-center rounded-2xl px-5 py-4"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
      }}
    >
      <Ionicons name="search" size={20} color={colors.secondary} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoFocus={autoFocus}
        returnKeyType={onSubmit ? "search" : "done"}
        onSubmitEditing={() => onSubmit?.(value)}
        className="ml-3 flex-1 text-base"
        style={{
          color: colors.text,
        }}
        {...props}
      />

      {value ? (
        <Pressable onPress={() => onChangeText("")}> 
          <Ionicons name="close-circle" size={20} color={colors.secondary} />
        </Pressable>
      ) : null}
    </ThemedView>
  );
}
