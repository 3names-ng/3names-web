import React from "react";
import {
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface AuthFooterProps {
  text: string;
  actionText: string;
  onPress: () => void;

  textColor?: string;
  actionColor?: string;

  fontSize?: number;
  marginTop?: number;
  marginBottom?: number;
}

export default function AuthFooter({
  text,
  actionText,
  onPress,

  textColor,
  actionColor = "#7C3AED",

  fontSize = 15,
  marginTop = 24,
  marginBottom = 24,
}: AuthFooterProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginTop,
        marginBottom,
      }}
      className="items-center"
    >
      <View className="flex-row items-center">
          <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
        >
        <ThemedText
          style={{
            color: textColor ?? colors.secondary,
            fontSize,
          }}
        >
          {text}
        </ThemedText>
  </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
        >
          <ThemedText
            className="ml-2 font-bold"
            style={{
              color: actionColor,
              fontSize,
            }}
          >
            {actionText}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}