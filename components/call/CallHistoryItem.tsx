/**
 * CallHistoryItem.tsx
 *
 * A single call history row showing:
 * - User avatar
 * - Call type icon (video/audio)
 * - Status (missed/accepted/rejected)
 * - Duration (if answered)
 * - Timestamp
 */

import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ui/ThemedText";

interface CallRecord {
  id: string;
  callType: "video" | "audio";
  status: "missed" | "rejected" | "accepted" | "cancelled";
  duration: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  isIncoming: boolean;
  otherUser: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
  };
}

interface Props {
  call: CallRecord;
  onPress: (call: CallRecord) => void;
  onCallback: (call: CallRecord) => void;
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatCallTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function CallHistoryItem({ call, onPress, onCallback }: Props) {
  const { colors } = useTheme();

  const user = call.otherUser;
  const displayName = user.username ||  "Unknown";

  const isMissed = call.status === "missed" && call.isIncoming;
  const isRejected = call.status === "rejected";
  const isAccepted = call.status === "accepted";
  const statusColor = isMissed ? "#EF4444" : isRejected ? "#F59E0B" : colors.text;

  // Status label
  const statusLabel = call.isIncoming
    ? isMissed
      ? "Missed"
      : isRejected
      ? "Declined"
      : "Received"
    : isRejected
    ? "Declined"
    : "Outgoing";

  // Status icon — small colored circle indicator
  const statusIcon = isMissed
    ? { name: "close-circle" as const, color: "#EF4444" }
    : isRejected
    ? { name: "ban" as const, color: "#F59E0B" }
    : isAccepted
    ? { name: "checkmark-circle" as const, color: "#22C55E" }
    : { name: "call" as const, color: colors.muted || "#71717a" };



  return (
    <TouchableOpacity
      onPress={() => onPress(call)}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {/* Avatar */}
      {user.profilePictureUrl ? (
        <Image
          source={{ uri: user.profilePictureUrl }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary || "#7C3AED",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>
            {displayName.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
      )}

      {/* Info */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <ThemedText
          style={{
            fontSize: 16,
            fontWeight: isMissed ? "700" : "600",
            color: statusColor,
          }}
          numberOfLines={1}
        >
          {displayName}
        </ThemedText>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
          <Ionicons
            name={statusIcon.name}
            size={13}
            color={statusIcon.color}
            style={{ marginRight: 4 }}
          />
          <ThemedText
            style={{ fontSize: 13, color: colors.muted || "#71717a" }}
          >
            {statusLabel}
            {call.duration > 0 ? ` · ${formatDuration(call.duration)}` : ""}
          </ThemedText>
        </View>
      </View>

      {/* Right side: time + call type icon */}
      <View style={{ alignItems: "flex-end" }}>
        <ThemedText
          style={{ fontSize: 12, color: colors.muted || "#71717a", marginBottom: 6 }}
        >
          {formatCallTime(call.createdAt)}
        </ThemedText>
        <TouchableOpacity
          onPress={() => onCallback(call)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={call.callType === "video" ? "videocam" : "call"}
            size={20}
            color={colors.primary || "#7C3AED"}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
