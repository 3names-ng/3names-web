import React, { useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { LeaderboardParams } from "@/service/leaderboard.Service";
import { useAuthStore } from "@/store/authStore";

type CategoryTabsProps = {
  onSelectScope?: (params: LeaderboardParams) => void;
};

const tabs = [
  
  { label: "By Department", scope: "department" as const },
  { label: "By Faculty", scope: "faculty" as const },
  { label: "By School", scope: "school" as const },
  { label: "Global", scope: "app" as const },
];

export default function CategoryTabs({ onSelectScope }: CategoryTabsProps) {
  const [selected, setSelected] = useState("By Department");
  const { isDark, colors } = useTheme();
  const user = useAuthStore((state) => state.user);

  const handleSelect = (tab: (typeof tabs)[number]) => {
    setSelected(tab.label);

    if (!onSelectScope) return;

    switch (tab.scope) {
      case "department":
        onSelectScope({
          scope: "department",
          departmentId: user?.departmentId || undefined,
        });
        break;

      case "faculty":
        onSelectScope({
          scope: "faculty",
          facultyId: user?.facultyId || undefined,
        });
        break;

      case "school":
        onSelectScope({
          scope: "school",
          schoolId: user?.schoolId || undefined,
        });
        break;

      case "app":
      default:
        onSelectScope({
          scope: "app",
        });
        break;
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 18,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.label === selected;

        return (
          <TouchableOpacity
            key={tab.label}
            activeOpacity={0.85}
            onPress={() => handleSelect(tab)}
            style={{
              height: 48,
              paddingHorizontal: 24,
              borderRadius: 24,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 14,
              backgroundColor: active
                ? "#6D28D9"
                : isDark
                ? colors.card
                : "#FFFFFF",
              borderWidth: active ? 0 : 1,
              borderColor: colors.border,
              elevation: active ? 4 : 1,
            }}
          >
            <ThemedText
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: active ? "#FFFFFF" : colors.text,
              }}
            >
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}