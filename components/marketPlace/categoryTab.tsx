import React from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { categories } from "@/data/marketPlace";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryTabs({
  selectedCategory,
  onSelectCategory,
}: CategoryTabsProps) {
  const { colors, isDark } = useTheme();

  return (
    <ThemedView style={{ marginTop: 24 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingRight: 40,
        }}
      >
        {categories.map((item) => {
          const active = selectedCategory === item.name;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => onSelectCategory(item.name)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 18,
                height: 46,
                borderRadius: 23,
                marginRight: 12,
                backgroundColor: active ? "#7C3AED" : colors.card,
                borderWidth: active ? 0 : 1,
                borderColor: colors.border,
                shadowColor: "#000",
                shadowOpacity: active ? 0 : 0.05,
                shadowRadius: 8,
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                elevation: active ? 0 : 2,
              }}
            >
              <Ionicons
                name={item.icon as any}
                size={18}
                color={
                  active
                    ? "#FFFFFF"
                    : isDark
                    ? colors.text
                    : "#555"
                }
              />

              <ThemedText
                style={{
                  marginLeft: 8,
                  fontSize: 15,
                  fontWeight: "700",
                  color: active ? "#FFFFFF" : colors.text,
                }}
              >
                {item.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}