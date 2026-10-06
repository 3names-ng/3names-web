import React from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";

import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";

interface Props {
  courseCode: string;
  course: string;
  year: string;
  semester: string;
  downloads: number;
  hasAccess: boolean;
  priceCoins: number;
  loading?: boolean;
  onPress?: () => void;
}

export default function QuestionCard({
  courseCode,
  course,
  year,
  semester,
  downloads,
  hasAccess,
  priceCoins,
  loading = false,
  onPress,
}: Props) {
  const { colors } = useTheme();
  return (
    <ThemedView
      className=" mb-4 rounded-3xl bg-white p-5 dark:bg-neutral-900"
      style={{
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left Side */}
        <View className="flex-1 flex-row items-start">
          {/* PDF Icon */}
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/40">
            <Ionicons name="document-text" size={30} color="#DC2626" />
          </View>

          {/* Details */}
          <View className="ml-4 flex-1">
            <ThemedText className="text-lg font-bold text-gray-900">
              {courseCode}
            </ThemedText>

            <ThemedText className="mt-1 text-base text-gray-600">
              {course}
            </ThemedText>

            <ThemedText className="mt-2 text-sm text-gray-500">
              {year} • {semester}
            </ThemedText>

            <View className="mt-3 flex-row items-center">
              <Feather name="eye" size={16} color="#6B7280" />

              <ThemedText className="ml-2 text-sm text-gray-500">
                {downloads.toLocaleString()} Views
              </ThemedText>
            </View>
          </View>
        </View>

        {/* View / Purchase Action */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          disabled={loading}
          className="ml-4 items-center justify-center rounded-full px-3 py-2"
          style={{
            backgroundColor: hasAccess ? "rgba(108, 71, 255, 0.1)" : "#6C47FF",
            minWidth: 48,
          }}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={hasAccess ? "#6C47FF" : "#FFFFFF"}
            />
          ) : hasAccess ? (
            <Ionicons name="eye-outline" size={22} color="#6C47FF" />
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="lock-closed-outline" size={14} color="#FFFFFF" />
              <ThemedText
                className="ml-1 text-xs font-bold"
                style={{ color: "#FFFFFF" }}
              >
                {priceCoins > 0 ? `${priceCoins}` : "Free"}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
