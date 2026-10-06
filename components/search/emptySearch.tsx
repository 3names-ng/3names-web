import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";

export default function EmptySearch() {
  return (
    <ThemedView className="flex-1 items-center justify-center px-6">
      <ThemedText className="text-xl font-bold mb-3 text-center">
        Start searching
      </ThemedText>
      <ThemedText className="text-center opacity-70">
        Search for people, schools, or courses to begin exploring.
      </ThemedText>
    </ThemedView>
  );
}
