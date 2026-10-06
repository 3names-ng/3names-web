import React, { useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

export type NotificationFilter =
  | "All"
  | "Unread"
  | "Messages"
  | "Marketplace"
  | "Hostel"
  | "Leaderboard";

interface Props {
  value?: NotificationFilter;
  onChange?: (tab: NotificationFilter) => void;
}

const tabs: NotificationFilter[] = [
  "All",
  "Unread",
  "Messages",
  "Marketplace",
  "Hostel",
  "Leaderboard",
];

export default function NotificationTabs({
  value = "All",
  onChange,
}: Props) {
  const { colors, isDark } = useTheme();

  const [selected, setSelected] =
    useState<NotificationFilter>(value);

  const selectTab = (tab: NotificationFilter) => {
    setSelected(tab);
    onChange?.(tab);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // ScrollView grows to fill free space by default; without this the tab
      // row swallows the screen and pushes the content below it to the bottom.
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
    >
      {tabs.map((tab) => {
        const active = selected === tab;

        return (
          <TouchableOpacity
            key={tab}
            activeOpacity={0.85}
            onPress={() => selectTab(tab)}
            style={{
              marginRight: 12,
              height: 44,
              paddingHorizontal: 18,
              borderRadius: 22,

              justifyContent: "center",
              alignItems: "center",

              backgroundColor: active
                ? "#7C3AED"
                : colors.card,

              borderWidth: 1,
              borderColor: active
                ? "#7C3AED"
                : colors.border,

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
            <ThemedText
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: active
                  ? "#FFFFFF"
                  : colors.text,
              }}
            >
              {tab}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}