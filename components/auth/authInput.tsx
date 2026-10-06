import React from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;

  placeholder?: string;

  icon?: keyof typeof Feather.glyphMap;

  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad";

  autoCapitalize?:
    | "none"
    | "words"
    | "sentences"
    | "characters";

  editable?: boolean;

  error?: string;
}

export default function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = "default",
  autoCapitalize = "none",
  editable = true,
  error,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View className="mb-3">
      {/* Label */}

      {/* <ThemedText className="mb-2 text-[15px] font-semibold">
        {label}
      </ThemedText> */}

      {/* Input */}

      <ThemedView
        style={{
          backgroundColor: colors.card,
          borderColor: error
            ? "#EF4444"
            : colors.border,
          borderWidth: 1,
        }}
        className="h-14 rounded-2xl flex-row items-center px-5"
      >
        {icon && (
          <Feather
            name={icon}
            size={20}
           color={
           colors.primary
          }
          />
        )}

        <TextInput
          value={value}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onChangeText={onChangeText}
          className="flex-1 ml-4 text-base"
          style={{
            color: colors.text,
          }}
        />
      </ThemedView>

      {error && (
        <ThemedText
          className="mt-2 text-red-500 text-sm"
        >
          {error}
        </ThemedText>
      )}
    </View>
  );
}