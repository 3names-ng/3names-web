import React from "react";
import { TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

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
  const { colors } = useTheme();

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 16,
        marginTop: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Title */}

      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "800",
          color: colors.primary,
        }}
      >
        {title}
      </ThemedText>

      {/* Action */}

    </View>
  );
}