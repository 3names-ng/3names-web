/**
 * ChatHeader — the top bar with back button, group name, member/online count,
 * and settings/options icon. Shared between both chat screens.
 */
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";

interface ChatHeaderProps {
  onBack: () => void;
  title: string;
  memberCount: number;
  onlineCount: number;
  socketStatus?: "connected" | "reconnecting" | "disconnected";
  onRightPress: () => void;
  rightIcon?: string;
  colors: {
    background: string;
    text: string;
    border: string;
    card?: string;
    muted?: string;
  };
}

export default function ChatHeader({
  onBack,
  title,
  memberCount,
  onlineCount,
  socketStatus,
  onRightPress,
  rightIcon = "ellipsis-vertical",
  colors,
}: ChatHeaderProps) {
  return (
    <ThemedView
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}
      className="flex-row items-center justify-between px-4 py-3"
    >
      <TouchableOpacity
        onPress={onBack}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card || "transparent",
          width: 35,
          height: 35,
        }}
        className="p-2 rounded-full justify-center items-center"
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onRightPress}
        className="items-center flex-1 mx-3"
      >
        <ThemedText className="font-bold text-base" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText
          style={{ color: colors.muted || "#a1a1aa" }}
          className="text-xs"
        >
          {memberCount} {memberCount === 1 ? "member" : "members"}
          {onlineCount > 0 ? ` • ${onlineCount} online` : ""}
          {socketStatus === "reconnecting" ? " • Reconnecting..." : ""}
          {socketStatus === "disconnected" ? " • Offline" : ""}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onRightPress}
        style={{ width: 35, height: 35 }}
        className="p-2 rounded-full justify-center items-center"
      >
        <Ionicons name={rightIcon as any} size={22} color={colors.text} />
      </TouchableOpacity>
    </ThemedView>
  );
}
