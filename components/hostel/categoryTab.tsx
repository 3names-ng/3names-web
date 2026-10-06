import React, { useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

const categories = [
  {
    id: "all",
    label: "All",
    icon: "apps",
  },
  {
    id: "boys",
    label: "Boys",
    icon: "male",
  },
  {
    id: "girls",
    label: "Girls",
    icon: "female",
  },
  {
    id: "mixed",
    label: "Mixed",
    icon: "people",
  },
  {
    id: "campus",
    label: "Near Campus",
    icon: "school",
  },
];

export default function CategoryTabs() {
  const [selected, setSelected] = useState("all");

  const { colors, isDark } = useTheme();

  return (
    <ThemedView
      style={{
        marginBottom: 20,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
        }}
      >
        {categories.map((item) => {
          const active = selected === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => setSelected(item.id)}
              style={{
                width: 82,
                height: 82,
                borderRadius: 22,
                marginRight: 14,
                justifyContent: "center",
                alignItems: "center",

                backgroundColor: active
                  ? "#7C3AED"
                  : colors.card,

                borderWidth: active ? 0 : 1,
                borderColor: colors.border,

                shadowColor: "#000",
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 8,
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                elevation: 3,
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={28}
                color={
                  active
                    ? "#FFFFFF"
                    : colors.text
                }
              />

              <ThemedText
                style={{
                  marginTop: 8,
                  fontWeight: "700",
                  fontSize: 13,
                  color: active
                    ? "#FFFFFF"
                    : colors.text,
                  textAlign: "center",
                }}
              >
                {item.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}