import React from "react";
import { Image, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "../ui/ThemedView";
import { useTranslation } from "@/hooks/useTranslation";


export default function CreatePost() {
  const { t } = useTranslation();
  return (
    <ThemedView className="mx-4 my-4 flex-row items-center rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <Image
        source={{ uri: "https://i.pravatar.cc/100" }}
        className="h-10 w-10 rounded-full"
      />

      <TextInput
        placeholder={t("createPost.placeholder")}
        placeholderTextColor="#9CA3AF"
        className="mx-4 flex-1 text-base text-black dark:text-white"
      />

      <Ionicons
        name="create-outline"
        size={26}
        color="#6C3EF4"
      />
    </ThemedView>
  );
}