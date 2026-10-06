import React, { useState } from "react";
import {
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useColorScheme } from "nativewind";

import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedView } from "../ui/ThemedView";
import { ThemedText } from "../ui/ThemedText";

const tabs = ["All", "CS", "ACC", "ECO", "BUS"];

export default function CategoryTabs() {
  const [selected, setSelected] = useState("All");
  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === "dark";

  return (
    <ThemedView className="mt-4 mb-5">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {tabs.map((tab) => {
          const active = selected === tab;

          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setSelected(tab)}
              className="mr-3 h-12 items-center justify-center rounded-2xl px-6"
              style={{
                backgroundColor: active
                  ? "#7C3AED"
                  : isDark
                  ? "#1F2937"
                  : "#FFFFFF",

                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
              }}
            >
              <ThemedText
                style={{
                  color: active
                    ? "#FFFFFF"
                    : isDark
                    ? "#F3F4F6"
                    : "#111827",
                }}
                className="text-base font-semibold"
              >
                {tab}
              </ThemedText>
            </TouchableOpacity>
          );
        })}

        {/* More Button */}

        <TouchableOpacity
          activeOpacity={0.8}
          className="h-12 flex-row items-center justify-center rounded-2xl px-6"
          style={{
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF",

            elevation: 2,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: {
              width: 0,
              height: 3,
            },
          }}
        >
          <ThemedText
            style={{
              color: isDark ? "#F3F4F6" : "#111827",
            }}
            className="text-base font-semibold"
          >
            More
          </ThemedText>

          <Ionicons
            name="chevron-down"
            size={18}
            color={isDark ? "#F3F4F6" : "#444"}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}