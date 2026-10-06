import React, { useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

const tabs = [
  {
    id: "departmentId",
    label: "departmentId",
    icon: "📚",
  },
  {
    id: "facultyId",
    label: "facultyId",
    icon: "🎓",
  },
  {
    id: "school",
    label: "School",
    icon: "🏫",
  },
  {
    id: "global",
    label: "Global",
    icon: "🌍",
  },
];

export default function LeaderboardTabs() {
  const [selected, setSelected] = useState("global");

  const { colors, isDark } = useTheme();

  return (
    <ThemedView className="mb-6 mt-6 bg-transparent">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {tabs.map((tab) => {
          const active = selected === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.85}
              onPress={() => setSelected(tab.id)}
              className="mr-3 flex-row items-center rounded-full px-5 py-3"
              style={{
                backgroundColor: active
                  ? "#6D28D9"
                  : colors.card,

                borderWidth: 1,
                borderColor: active
                  ? "#6D28D9"
                  : colors.border,
              }}
            >
              <ThemedText className="mr-2 text-lg">
                {tab.icon}
              </ThemedText>

              <ThemedText
                style={{
                  color: active
                    ? "#FFFFFF"
                    : colors.text,
                }}
                className="font-semibold"
              >
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time Filter */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
      >
        {["Today", "Week", "Month", "All Time"].map((item, index) => (
          <TouchableOpacity
            key={item}
            className={`mr-3 rounded-full px-5 py-2 ${
              index === 3
                ? "bg-violet-600"
                : ""
            }`}
            style={{
              backgroundColor:
                index === 3
                  ? "#6D28D9"
                  : colors.card,

              borderWidth: 1,
              borderColor:
                index === 3
                  ? "#6D28D9"
                  : colors.border,
            }}
          >
            <ThemedText
              style={{
                color:
                  index === 3
                    ? "#fff"
                    : colors.text,
              }}
              className="font-medium"
            >
              {item}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );
}