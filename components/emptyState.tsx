import React from "react";
import { Pressable } from "react-native";
import { Inbox, RefreshCw } from "lucide-react-native";
import { ThemedView } from "./ui/ThemedView";
import { ThemedText } from "./ui/ThemedText";

interface EmptyStateProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onPressAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = "No posts found",
  description = "There are no posts available in this feed right now.",
  buttonText,
  onPressAction,
  icon,
}: EmptyStateProps) {
  return (
    <ThemedView className="items-center justify-center rounded-3xl mt-44 mx-4 my-6 bg-neutral-50 dark:bg-neutral-900/50 p-8 border border-neutral-200/60 dark:border-neutral-800/60">
      {/* Icon Badge */}
      <ThemedView className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/50">
        {icon || <Inbox size={32} className="text-violet-600 dark:text-violet-400" color="#7c3aed" />}
      </ThemedView>

      {/* Title */}
      <ThemedText className="text-center text-lg font-bold text-neutral-800 dark:text-neutral-100">
        {title}
      </ThemedText>

      {/* Description */}
      <ThemedText className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400 leading-5">
        {description}
      </ThemedText>

      {/* Optional Action Button */}
      {buttonText && onPressAction && (
        <Pressable
          onPress={onPressAction}
          className="mt-5 flex-row items-center justify-center rounded-xl bg-violet-600 px-5 py-2.5 active:opacity-80"
        >
          <RefreshCw size={16} color="#ffffff" className="mr-2" />
          <ThemedText className="text-sm font-semibold text-white">
            {buttonText}
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}