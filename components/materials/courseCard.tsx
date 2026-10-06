import React from "react";
import { TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";

interface Props {
  code: string;
  title: string;
  downloads: number;
  color: string;
  background: string;
  onPress?: () => void;
}

export default function CourseCard({
  code,
  title,
  downloads,
  color,
  background,
  onPress,
}: Props) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <ThemedView className="flex-row items-center bg-white px-5 py-5 dark:bg-neutral-900">
        {/* Left Badge */}
        <View
          className="h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: background }}
        >
          <ThemedText
            className="text-xl font-bold"
            style={{ color }}
          >
            {code}
          </ThemedText>
        </View>

        {/* Title */}
        <View className="ml-4 flex-1">
          <ThemedText className="text-lg font-bold text-gray-900">
            {title}
          </ThemedText>

          <ThemedText className="mt-1 text-base text-gray-500">
            {downloads.toLocaleString()} downloads
          </ThemedText>
        </View>

        {/* Arrow */}
        <Ionicons
          name="download"
          size={22}
          color="#BDBDBD"
        />
      </ThemedView>

      <View className=" h-[1px] bg-gray-100 dark:bg-neutral-800" />
    </TouchableOpacity>
  );
}