import React from "react";
import { Modal, ActivityIndicator, View } from "react-native";
import { ThemedText } from "@/components/ui/ThemedText";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({
  visible,
  message = "",
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center mt-4 px-6">
        <View className="items-center justify-center rounded-3xl  p-6 shadow-xl  min-w-[180px]">
          <ActivityIndicator size="large" color="#7c3aed" />

          {message ? (
            <ThemedText className="mt-4 text-center text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              {message}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
