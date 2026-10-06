import React from "react";
import {
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  unreadCount: number;
  onMarkAllRead?: () => void;
  onSettings?: () => void;
}

export default function NotificationHeader({
  unreadCount,
  onMarkAllRead,
  onSettings,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 18,
      }}
    >
      {/* Top Row */}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <ThemedText
            style={{
              fontSize: 32,
              fontWeight: "800",
              color: colors.text,
            }}
          >
            Notifications
          </ThemedText>

          <ThemedText
            style={{
              marginTop: 4,
              fontSize: 15,
              color: colors.secondary,
            }}
          >
            {unreadCount} unread notifications
          </ThemedText>
        </View>

        <View
          style={{
            flexDirection: "row",
          }}
        >
          {/* Mark All Read */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onMarkAllRead}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Ionicons
              name="checkmark-done"
              size={22}
              color="#7C3AED"
            />
          </TouchableOpacity>

          {/* Settings */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSettings}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: "#7C3AED",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Unread Badge */}

      {unreadCount > 0 && (
        <View
          style={{
            marginTop: 20,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F3E8FF",
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#7C3AED",
              marginRight: 8,
            }}
          />

          <ThemedText
            style={{
              color: "#7C3AED",
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            {unreadCount} New Notifications
          </ThemedText>
        </View>
      )}
    </View>
  );
}