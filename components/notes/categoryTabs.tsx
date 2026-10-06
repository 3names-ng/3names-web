import React from "react";
import { FlatList, Pressable } from "react-native";
import { useColorScheme } from "nativewind";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

interface Props {
  tabs: string[];
  selected: string;
  onSelect: (tab: string) => void;
}

export default function CategoryTabs({
  tabs,
  selected,
  onSelect,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ThemedView className="mt-3 bg-transparent">
      <FlatList
        horizontal
        data={tabs}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingRight: 10,
        }}
        renderItem={({ item }) => {
          const active = selected === item;

          return (
            <Pressable
              onPress={() => onSelect(item)}
              android_ripple={{
                color: isDark ? "#4C1D95" : "#EDE9FE",
              }}
              className="h-[54px] min-w-[95px] rounded-[20px] items-center justify-center mr-3 border"
              style={{
                backgroundColor: active
                  ? "#6F3FF5"
                  : isDark
                  ? "#111"
                  : "#FFFFFF",

                borderColor: active
                  ? "#6F3FF5"
                  : isDark
                  ? "#374151"
                  : "#E5E7EB",
              }}
            >
              <ThemedText
                className="text-[15px] font-semibold"
                style={{
                  color: active
                    ? "#FFFFFF"
                    : isDark
                    ? "#FFFFFF"
                    : "#111827",
                }}
              >
                {item}
              </ThemedText>
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}