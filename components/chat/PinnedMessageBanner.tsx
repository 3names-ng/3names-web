/**
 * PinnedMessageBanner — the yellow pinned-message strip shown at the top of chat.
 */
import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";

interface PinnedMessageBannerProps {
  pinnedMessage: {
    content?: string;
    senderName?: string;
    mediaUrl?: string;
    mediaName?: string;
    [key: string]: any;
  };
  isDark: boolean;
  colors: { muted?: string; border?: string };
  onPress: () => void;
}

export default function PinnedMessageBanner({
  pinnedMessage,
  isDark,
  colors,
  onPress,
}: PinnedMessageBannerProps) {
  const preview = (() => {
    const text = (pinnedMessage.content || "").trim();
    if (!text) return pinnedMessage.mediaUrl ? "📎 Attachment" : "📌 Message";
    return text.length > 50 ? `${text.slice(0, 50)}…` : text;
  })();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: isDark
          ? "rgba(245, 158, 11, 0.1)"
          : "rgba(245, 158, 11, 0.06)",
        borderWidth: 1,
        borderColor: isDark
          ? "rgba(245, 158, 11, 0.25)"
          : "rgba(245, 158, 11, 0.2)",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 4,
      }}
    >
      <ThemedView
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "transparent",
        }}
      >
        <Ionicons
          name="pin"
          size={13}
          color={isDark ? "#fbbf24" : "#d97706"}
          style={{ marginRight: 6 }}
        />
        <ThemedText
          numberOfLines={1}
          style={{
            color: isDark ? "#fbbf24" : "#d97706",
            fontSize: 12,
            fontWeight: "600",
            flex: 1,
          }}
        >
          {pinnedMessage.senderName || "Pinned"}:
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          style={{
            color: colors.muted || "#a1a1aa",
            fontSize: 11,
            marginLeft: 4,
            flex: 2,
          }}
        >
          {preview}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );
}
