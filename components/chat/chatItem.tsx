import React, { memo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useTheme } from "@/hooks/useTheme";
import { ProfileFrame } from "@/components/ui/ProfileFrame";
import { ThemedText } from "../ui/ThemedText";
import { ThemedView } from "../ui/ThemedView";

interface Participant {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profilePictureUrl?: string;
}

export interface ChatItemData {
  id: string;
  name?: string | null;
  avatar?: string;
  iconUrl?: string | null;
  participant?: Participant;
  lastMessage?: string;
  lastMessageContent?: string;
  lastMessagePreview?: {
    content?: string | null;
    isAudio?: boolean;
    mimeType?: string | null;
    durationMillis?: number | null;
    readByOther?: boolean;
    readReceiptsEnabled?: boolean;
  };
  time?: string;
  lastMessageAt?: string | number | null;
  unread?: number;
  unreadCount?: number;
  online?: boolean;
  verified?: boolean;
  typing?: boolean;
  isPinned?: boolean;
}

// Format a millisecond duration as m:ss (e.g. 83000 → 1:23)
const formatDuration = (millis?: number | null) => {
  if (!millis || !Number.isFinite(millis) || millis <= 0) return "0:00";
  const totalSeconds = Math.round(millis / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface Props {
  item: ChatItemData;
  onPress?: () => void;
}

// Parse whatever shape the backend sends a timestamp in — ISO string,
// epoch millis, epoch seconds, or a Firestore-like { seconds } object —
// into a valid Date, or null if it can't be parsed.
const parseTimestamp = (
  value?: string | number | { seconds?: number; _seconds?: number } | null,
): Date | null => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "object") {
    const seconds = value.seconds ?? value._seconds;
    return typeof seconds === "number" ? new Date(seconds * 1000) : null;
  }

  if (typeof value === "number") {
    // Epoch seconds (10 digits) vs epoch millis (13 digits)
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Numeric string (epoch) vs ISO date string
  const numeric = Number(value);
  if (/^\d+$/.test(value) && !Number.isNaN(numeric)) {
    return parseTimestamp(numeric);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Format a last-message timestamp: time if today, otherwise a short date
const formatTimestamp = (
  value?: string | number | { seconds?: number; _seconds?: number } | null,
) => {
  const date = parseTimestamp(value);
  if (!date) return "";

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

function ChatItem({ item, onPress }: Props) {
  const { colors, isDark } = useTheme();

  // Extract display values with fallback priority
  const displayName =
    item.name ??
    item.participant?.username ??
    (item.participant ? `${item.participant.firstName ?? ""} ${item.participant.lastName ?? ""}`.trim() : "Chat");

  const avatarUrl =
    item.avatar || item.participant?.profilePictureUrl || item.iconUrl || "";

  const profileFrame = (item as any).profileFrame || (item.participant as any)?.profileFrame || null;

  const lastMessageText = item.lastMessage ?? item.lastMessageContent ?? "";
  const lastMessagePreview = item.lastMessagePreview;
  // Voice-note last message: show a mic icon + duration instead of raw text
  const isVoiceLastMessage =
    Boolean(lastMessagePreview?.isAudio) ||
    lastMessagePreview?.mimeType?.startsWith("audio/") ||
    false;

  // Last-message read state (only meaningful when the last message is mine)
  const lastMessageRead =
    lastMessagePreview?.readReceiptsEnabled !== false &&
    Boolean(lastMessagePreview?.readByOther);
  const unreadCount = item.unread ?? item.unreadCount ?? 0;
  const timeText = item.time || formatTimestamp(item.lastMessageAt);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.container}>
      <ThemedView
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowOpacity: isDark ? 0 : 0.05,
          },
        ]}
      >
        {/* Avatar */}
        <View>
          <ProfileFrame
            frameId={profileFrame}
            uri={avatarUrl}
            size={52}
            initial={displayName?.[0]?.toUpperCase()}
            fallbackColor={colors.primary}
          />
          {item.online && (
            <View style={[styles.onlineIndicator, { borderColor: colors.card }]} />
          )}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.nameRow}>
            <ThemedText style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </ThemedText>
            {item.isPinned && (
              <Ionicons
                name="pin"
                size={14}
                color="#F59E0B"
                style={{ marginLeft: 6, transform: [{ rotate: '45deg' }] }}
              />
            )}
            {item.verified && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#3B82F6"
                style={styles.verifiedIcon}
              />
            )}
          </View>

          {isVoiceLastMessage ? (
            <View style={styles.lastMessageRow}>
              <Ionicons
                name="mic"
                size={14}
                color={item.typing ? "#7C3AED" : colors.secondary}
              />
              <ThemedText
                numberOfLines={1}
                style={[
                  styles.lastMessage,
                  styles.voiceDuration,
                  { color: item.typing ? "#7C3AED" : colors.secondary },
                  item.typing && styles.typingText,
                ]}
              >
                Voice note.....
                 {/* · {formatDuration(lastMessagePreview?.durationMillis)} */}
              </ThemedText>
            </View>
          ) : (
            <ThemedText
              numberOfLines={1}
              style={[
                styles.lastMessage,
                { color: item.typing ? "#7C3AED" : colors.secondary },
                item.typing && styles.typingText,
              ]}
            >
              {lastMessageText}
            </ThemedText>
          )}
        </View>

        {/* Right Side */}
        <View style={styles.rightContainer}>
          <ThemedText
            style={[
              styles.timeText,
              {
                color: unreadCount > 0 ? "#7C3AED" : colors.secondary,
                fontWeight: unreadCount > 0 ? "700" : "500",
              },
            ]}
          >
            {timeText}
          </ThemedText>

          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadText}>{unreadCount}</ThemedText>
            </View>
          ) : (
            <Ionicons
              name={lastMessageRead ? "checkmark-done" : "checkmark"}
              size={18}
              color={lastMessageRead ? "#38BDF8" : "#9CA3AF"}
            />
          )}
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
}

export default memo(ChatItem);

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#E5E7EB",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    borderWidth: 3,
  },
  contentContainer: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    fontSize: 17,
    fontWeight: "800",
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  lastMessage: {
    marginTop: 6,
    fontSize: 14,
  },
  lastMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  voiceDuration: {
    marginTop: 0,
    marginLeft: 6,
  },
  typingText: {
    fontStyle: "italic",
  },
  rightContainer: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 60,
  },
  timeText: {
    fontSize: 12,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});