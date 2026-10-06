import React from "react";
import { TouchableOpacity, View } from "react-native";

import { ThemedText } from "../ui/ThemedText";

interface Props {
  title: string;
  action?: string;
  onPress?: () => void;
}

export default function SectionHeader({
  title,
  action = "See all",
  onPress,
}: Props) {
  return (
    <View className="mb-2 mt-6 flex-row items-center justify-between">
      <ThemedText color="primary" className="text-lg font-bold">
        {title}
      </ThemedText>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
      >
        <ThemedText color="primary" className="text-base font-semibold">
          {action}
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}