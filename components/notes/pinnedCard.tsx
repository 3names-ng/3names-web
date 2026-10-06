import React from "react";
import { Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

interface Note {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
}

interface Props {
  note: Note;
  onPress?: () => void;
  onMorePress?: () => void;
}

export default function PinnedCard({
  note,
  onPress,
  onMorePress,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: isDark ? "#374151" : "#F3F4F6",
      }}
      className="rounded-3xl p-6 border"
      style={{
        backgroundColor: isDark ? "#111" : "#FFFFFF",
        borderColor: isDark ? "#374151" : "#E5E7EB",

        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
      }}
    >
      {/* Header */}
      <ThemedView className="flex-row justify-between items-start bg-transparent">
        <ThemedView className="flex-row flex-1 mr-3 bg-transparent">
          <ThemedView
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{
              backgroundColor: isDark ? "#3B3420" : "#FFF7DD",
            }}
          >
            <Feather
              name="star"
              size={18}
              color="#F6B500"
            />
          </ThemedView>

          <ThemedView className="flex-1 bg-transparent justify-center">
            <ThemedText
              numberOfLines={1}
              className="text-xl font-bold"
            >
              {note.title}
            </ThemedText>

            <ThemedText
              className="mt-1.5 text-[15px]"
              style={{
                color: isDark ? "#9CA3AF" : "#6B7280",
              }}
            >
              {note.category}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <Pressable
          onPress={onMorePress}
          className="p-1"
          hitSlop={10}
        >
          <Feather
            name="more-horizontal"
            size={22}
            color={isDark ? "#D1D5DB" : "#666666"}
          />
        </Pressable>
      </ThemedView>

      {/* Description */}
      <ThemedText
        numberOfLines={3}
        className="mt-5 text-base leading-7"
        style={{
          color: isDark ? "#D1D5DB" : "#4B5563",
        }}
      >
        {note.description}
      </ThemedText>

      {/* Footer */}
      <ThemedView className="flex-row justify-between items-center mt-6 bg-transparent">
        <ThemedText
          className="text-[15px]"
          style={{
            color: isDark ? "#9CA3AF" : "#6B7280",
          }}
        >
          {note.date}
        </ThemedText>

        <ThemedView
          className="flex-row items-center rounded-full px-3 py-2"
          style={{
            backgroundColor: isDark ? "#312E81" : "#F3EEFF",
          }}
        >
          <MaterialCommunityIcons
            name="pin"
            size={18}
            color="#8B5CF6"
          />

          <ThemedText
            className="ml-1.5 text-sm font-bold"
            style={{
              color: "#8B5CF6",
            }}
          >
            Pinned
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}