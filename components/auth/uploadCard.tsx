import React from "react";
import {
  TouchableOpacity,
  View,
} from "react-native";

import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
  file?: {
    name: string;
    uri: string;
  } | null;
  onPress: () => void;
}

export default function UploadCard({
  title,
  subtitle,
  icon = "file-text",
  file,
  onPress,
}: Props) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{ marginBottom: 18 }}
    >
      <ThemedView
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        }}
        className="rounded-3xl p-5"
      >
        <View className="flex-row items-center">
          {/* Icon */}

          <View
            className="w-14 h-14 rounded-2xl items-center justify-center"
            style={{
              backgroundColor: "#F3E8FF",
            }}
          >
            <Feather
              name={icon}
              size={24}
              color="#7C3AED"
            />
          </View>

          {/* Text */}

          <View className="flex-1 ml-4">
            <ThemedText className="text-lg font-bold">
              {title}
            </ThemedText>

            <ThemedText
              className="mt-1"
              style={{
                color: colors.secondary,
              }}
            >
              {file
                ? file.name
                : subtitle}
            </ThemedText>
          </View>

          {/* Status */}

          {file ? (
            <View className="items-center">
              <Ionicons
                name="checkmark-circle"
                size={28}
                color="#22C55E"
              />

              <ThemedText
                className="text-xs mt-1"
                style={{
                  color: "#22C55E",
                }}
              >
                Uploaded
              </ThemedText>
            </View>
          ) : (
            <Feather
              name="upload-cloud"
              size={24}
              color="#7C3AED"
            />
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}