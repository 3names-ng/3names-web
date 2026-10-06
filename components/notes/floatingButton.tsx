import React from "react";
import { Pressable, ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/ui/ThemedText";

interface FloatingButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export default function FloatingButton({
  onPress,
  style,
}: FloatingButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#8B5CF6" }}
      className="absolute bottom-28 right-5 h-[48px] px-3 rounded-full flex-row items-center justify-center bg-[#6F3FF5]"
      style={[
        {
          shadowColor: "#6F3FF5",
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 12,
        },
        style,
      ]}
    >
      <Ionicons
        name="add"
        size={24}
        color="#FFFFFF"
      />

      <ThemedText
        className="ml-2 text-md font-bold"
        style={{ color: "#FFFFFF" }}
      >
        New Note
      </ThemedText>
    </Pressable>
  );
}