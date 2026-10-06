import React from "react";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";

export const REPORT_REASONS = [
  "Spam or scam",
  "Harassment or bullying",
  "Hate speech or threats",
  "Nudity or sexual content",
  "Violence or self-harm",
  "Something else",
] as const;

interface ReportReasonSheetProps {
  visible: boolean;
  /** What is being reported, e.g. "message" or "user" — used in the title. */
  subject: string;
  onSelect: (reason: string) => void;
  onClose: () => void;
}

/** Bottom sheet for picking why a chat message or user is being reported. */
export default function ReportReasonSheet({ visible, subject, onSelect, onClose }: ReportReasonSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <ThemedView
          style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
          className="p-5 pb-8"
        >
          <ThemedText className="text-lg font-bold">Report {subject}</ThemedText>
          <ThemedText style={{ color: colors.muted }} className="text-xs mt-1 mb-3">
            Reports are anonymous. Our team reviews them and removes content that breaks our community
            guidelines.
          </ThemedText>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              onPress={() => onSelect(reason)}
              className="flex-row items-center justify-between py-3"
              style={{ borderBottomWidth: 1, borderColor: colors.border }}
            >
              <ThemedText className="font-semibold">{reason}</ThemedText>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </TouchableOpacity>
          ))}
          <View className="mt-2">
            <TouchableOpacity onPress={onClose} className="py-3 items-center">
              <ThemedText style={{ color: colors.muted }} className="font-semibold">
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </Pressable>
    </Modal>
  );
}
