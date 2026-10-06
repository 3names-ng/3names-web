import React from "react";

import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";

export default function NoResult() {
  return (
    <ThemedView className="flex-1 items-center justify-center px-6">
      <ThemedText className="text-xl font-bold mb-3 text-center">
        No results found
      </ThemedText>
      <ThemedText className="text-center opacity-70">
        Try a different keyword or check your spelling.
      </ThemedText>
    </ThemedView>
  );
}
