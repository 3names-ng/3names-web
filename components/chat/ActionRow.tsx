/**
 * ActionRow — a settings-style row with icon badge, label, and chevron.
 * Reusable across both chat detail screens.
 */
import React from "react";
import { TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";

interface ActionRowProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  /** Override the label color (e.g. red for destructive) */
  labelColor?: string;
  /** Override the chevron color */
  chevronColor?: string;
  /** Additional style for the row */
  style?: any;
}

export default function ActionRow({
  label,
  icon,
  onPress,
  labelColor,
  chevronColor = "#71717a",
  style,
}: ActionRowProps) {
  return (
    <TouchableOpacity
      style={[{ marginTop: 12 }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ThemedView
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 16,
        }}
      >
        <ThemedView style={{ flexDirection: "row", alignItems: "center" }}>
          {icon}
          <ThemedText
            style={{
              marginLeft: 14,
              fontSize: 15,
              fontWeight: "500",
              color: labelColor,
            }}
          >
            {label}
          </ThemedText>
        </ThemedView>
        <ChevronRight size={18} color={chevronColor} />
      </ThemedView>
    </TouchableOpacity>
  );
}
