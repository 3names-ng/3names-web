import React from "react";
import { View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "../ui/ThemedText";
import NotificationCard from "./notificationCard";
import { NotificationUI } from "@/screens/(features)/notificationScreen";


interface Props {
  title: string;
  data: NotificationUI[];
  onPress?: (notification: NotificationUI) => void;
}

export default function NotificationSection({
  title,
  data,
  onPress,
}: Props) {
  const { colors } = useTheme();

  if (!data.length) return null;

  return (
    <View
      style={{
        marginBottom: 26,
      }}
    >
      {/* Section Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          marginBottom: 14,
        }}
      >
        <ThemedText
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: colors.text,
          }}
        >
          {title}
        </ThemedText>

        <View
          style={{
            backgroundColor: "#7C3AED15",
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 20,
          }}
        >
          <ThemedText
            style={{
              color: "#7C3AED",
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            {data.length}
          </ThemedText>
        </View>
      </View>

      {/* Notifications */}
      {data.map((item) => (
        <NotificationCard
          key={item.id}
          item={item}
          onPress={() => onPress?.(item)}
        />
      ))}
    </View>
  );
}