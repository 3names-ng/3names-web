import React from "react";
import {
  TouchableOpacity,
  View,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "../ui/ThemedText";

interface Props {
  totalGroups: number;
  onCreateGroup?: () => void;
  onNotifications?: () => void;
}

export default function GroupHeader({
  totalGroups,
  onCreateGroup,
  onNotifications,
}: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
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
        {/* Title */}

        <View style={{ flex: 1 }}>
          <ThemedText
            style={{
              fontSize: 34,
              fontWeight: "900",
              color: colors.text,
            }}
          >
            Groups
          </ThemedText>

          <ThemedText
            style={{
              marginTop: 6,
              fontSize: 15,
              color: colors.secondary,
            }}
          >
            Discover, join and chat with campus communities
          </ThemedText>
        </View>

        {/* Actions */}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* Notification */}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNotifications}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              marginRight: 12,

              shadowColor: "#000",
              shadowOpacity: isDark ? 0 : 0.05,
              shadowRadius: 8,
              shadowOffset: {
                width: 0,
                height: 4,
              },
              elevation: 2,
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />

            {/* Notification Dot */}

            <View
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#EF4444",
              }}
            />
          </TouchableOpacity>

          {/* Create Group */}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onCreateGroup}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#7C3AED",

              shadowColor: "#7C3AED",
              shadowOpacity: 0.3,
              shadowRadius: 10,
              shadowOffset: {
                width: 0,
                height: 5,
              },
              elevation: 4,
            }}
          >
            <Ionicons
              name="add"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}

      <View
        style={{
          flexDirection: "row",
          marginTop: 22,
          justifyContent: "space-between",
        }}
      >
        {/* Total Groups */}

        <View
          style={{
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: "center",
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: 10,
          }}
        >
          <ThemedText
            style={{
              fontSize: 28,
              fontWeight: "900",
              color: "#7C3AED",
            }}
          >
            {totalGroups}
          </ThemedText>

          <ThemedText
            style={{
              marginTop: 6,
              color: colors.secondary,
              fontSize: 14,
            }}
          >
            Communities
          </ThemedText>
        </View>

        {/* Active */}

        <View
          style={{
            flex: 1,
            backgroundColor: "#7C3AED",
            borderRadius: 20,
            paddingVertical: 18,
            alignItems: "center",
          }}
        >
          <ThemedText
            style={{
              fontSize: 28,
              fontWeight: "900",
              color: "#FFFFFF",
            }}
          >
            1.2K+
          </ThemedText>

          <ThemedText
            style={{
              marginTop: 6,
              color: "#E9D5FF",
              fontSize: 14,
            }}
          >
            Members Online
          </ThemedText>
        </View>
      </View>
    </View>
  );
}