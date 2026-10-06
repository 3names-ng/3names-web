import React, { useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Feather from "@expo/vector-icons/Feather";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  editable?: boolean;
  showStrength?: boolean; // New optional prop to toggle the strength bar
}

export default function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  editable = true,
  showStrength = false, // Default to false so it doesn't show on login
}: Props) {
  const { colors, isDark } = useTheme();
  const [secure, setSecure] = useState(true);

  return (
    <View className="mb-3">
      {/* Label */}
      {/* <ThemedText className="mb-2 text-[15px] font-semibold">
        {label}
      </ThemedText> */}

      {/* Input */}
      <ThemedView
        className="h-14 rounded-2xl flex-row items-center px-5"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: error
            ? "#EF4444"
            : colors.border,
        }}
      >
        <Feather
          name="lock"
          size={20}
          color={colors.primary}
        />

        <TextInput
          value={value}
          editable={editable}
          secureTextEntry={secure}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onChangeText={onChangeText}
          className="flex-1 ml-4 text-base"
          style={{
            color: colors.text,
          }}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSecure(!secure)}
        >
          <Feather
            name={secure ? "eye" : "eye-off"}
            size={21}
            color={colors.primary}
          />
        </TouchableOpacity>
      </ThemedView>

      {/* Error */}
      {error && (
        <ThemedText className="mt-2 text-sm text-red-500">
          {error}
        </ThemedText>
      )}

      {/* Strength Indicator */}
      {showStrength && value.length > 0 && (
        <View className="mt-3">
          <View className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <View
              style={{
                width:
                  value.length < 6
                    ? "30%"
                    : value.length < 10
                    ? "65%"
                    : "100%",

                backgroundColor:
                  value.length < 6
                    ? "#EF4444"
                    : value.length < 10
                    ? "#F59E0B"
                    : "#10B981",

                height: "100%",
              }}
            />
          </View>

          <ThemedText
            className="mt-2 text-xs"
            style={{
              color:
                value.length < 6
                  ? "#EF4444"
                  : value.length < 10
                  ? "#F59E0B"
                  : "#10B981",
            }}
          >
            {value.length < 6
              ? "Weak password"
              : value.length < 10
              ? "Medium password"
              : "Strong password"}
          </ThemedText>
        </View>
      )}
    </View>
  );
}