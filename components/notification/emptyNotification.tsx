import React from "react";
import {
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "../ui/ThemedText";

interface Props {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onPress?: () => void;
}

export default function EmptyNotification({
  title = "You're all caught up!",
  subtitle = "You don't have any notifications right now. We'll notify you when something important happens.",

}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        // Fill the space below the tabs and centre in it.
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 10,
        // Nudge up a little so it reads as centred on screen, not just in the
        // area under the header and tabs.
        paddingBottom: 60,
      }}
    >
      {/* Illustration */}

      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: isDark
            ? "#7C3AED20"
            : "#F3E8FF",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#7C3AED",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons
            name="notifications-outline"
            size={26}
            color="#FFFFFF"
          />
        </View>
      </View>

      {/* Title */}

      <ThemedText
        style={{
          marginTop: 15,
          fontSize: 24,
          fontWeight: "800",
          color: colors.text,
          textAlign: "center",
        }}
      >
        {title}
      </ThemedText>

      {/* Subtitle */}

      <ThemedText
        style={{
          marginTop: 8,
          fontSize: 15,
          lineHeight: 24,
          textAlign: "center",
          color: colors.secondary,
        }}
      >
        {subtitle}
      </ThemedText>

    </View>
  );
}