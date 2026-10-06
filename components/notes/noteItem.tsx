import React from "react";
import { Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";

export interface NoteItemData {
  id: string;
  title: string;
  category: string;
  date: string;
  color: string;
  icon:
    | "book-open-page-variant"
    | "account"
    | "bookmark"
    | "school"
    | "clipboard-text"
    | "notebook";
}

interface Props {
  note: NoteItemData;
  onPress?: () => void;
}

export default function NoteItem({
  note,
  onPress,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{
        color: isDark ? "#374151" : "#F3F4F6",
      }}
      className="h-[92px] flex-row items-center justify-between px-5 border-b"
      style={{
        borderBottomColor: isDark ? "#374151" : "#F3F4F6",
      }}
    >
      {/* Left */}
      <ThemedView className="flex-row items-center flex-1 mr-3 bg-transparent">
        <ThemedView
          className="w-14 h-14 rounded-[18px] items-center justify-center mr-4"
          style={{
            backgroundColor: `${note.color}20`,
          }}
        >
          <MaterialCommunityIcons
            name={note.icon}
            size={24}
            color={note.color}
          />
        </ThemedView>

        <ThemedView className="flex-1 bg-transparent">
          <ThemedText
            numberOfLines={1}
            className="text-lg font-bold"
          >
            {note.title}
          </ThemedText>

          <ThemedText
            className="text-sm mt-1"
            style={{
              color: isDark ? "#9CA3AF" : "#6B7280",
            }}
          >
            {note.category}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Right */}
      <ThemedView className="items-end justify-center bg-transparent">
        <ThemedText
          className="text-[13px] mb-1"
          style={{
            color: isDark ? "#9CA3AF" : "#9CA3AF",
          }}
        >
          {note.date}
        </ThemedText>

        <Feather
          name="chevron-right"
          size={20}
          color={isDark ? "#6B7280" : "#BDBDBD"}
        />
      </ThemedView>
    </Pressable>
  );
}