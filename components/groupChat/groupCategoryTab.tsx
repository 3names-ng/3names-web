import React, { useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "../ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";

export type GroupCategory =
  | "All"
  | "facultyId"
  | "departmentId"
  | "Study"
  | "Marketplace"
  | "Hostel"
  | "Social";

interface Props {
  value?: GroupCategory;
  onChange?: (category: GroupCategory) => void;
}

const categories: {
  label: GroupCategory;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    label: "All",
    icon: "apps",
  },
  {
    label: "facultyId",
    icon: "school",
  },
  {
    label: "departmentId",
    icon: "library",
  },
  {
    label: "Study",
    icon: "book",
  },
  {
    label: "Marketplace",
    icon: "cart",
  },
  {
    label: "Hostel",
    icon: "home",
  },
  {
    label: "Social",
    icon: "people",
  },
];

export default function GroupCategoryTabs({
  value = "All",
  onChange,
}: Props) {
  const { colors, isDark } = useTheme();

  const [selected, setSelected] =
    useState<GroupCategory>(value);

  const handleSelect = (
    category: GroupCategory
  ) => {
    setSelected(category);
    onChange?.(category);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingBottom: 20,
      }}
    >
      {categories.map((item) => {
        const active =
          selected === item.label;

        return (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.85}
            onPress={() =>
              handleSelect(item.label)
            }
            style={{
              flexDirection: "row",
              alignItems: "center",

              marginRight: 12,

              paddingHorizontal: 18,
              height: 46,

              borderRadius: 23,

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
            <Ionicons
              name={item.icon}
              size={18}
              color={
                active
                  ? "#FFFFFF"
                  : colors.secondary
              }
            />

            <ThemedText
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontWeight: "700",
                color: active
                  ? "#FFFFFF"
                  : colors.text,
              }}
            >
              {item.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}