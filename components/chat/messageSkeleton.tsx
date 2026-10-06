import React from "react";
import { Pressable, StyleSheet, View, type DimensionValue } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/hooks/useTheme";
import { Skeleton, SkeletonCircle, SkeletonGroup } from "@/components/ui/skeleton";

type BubbleShape = { mine: boolean; width: DimensionValue; height: number };

// A fixed, natural-looking back-and-forth so the layout doesn't shuffle between renders
const BUBBLES: BubbleShape[] = [
  { mine: false, width: "58%", height: 40 },
  { mine: true, width: "44%", height: 36 },
  { mine: false, width: "70%", height: 58 },
  { mine: true, width: "52%", height: 40 },
  { mine: true, width: "36%", height: 36 },
  { mine: false, width: "46%", height: 36 },
  { mine: true, width: "64%", height: 58 },
  { mine: false, width: "54%", height: 40 },
];

/**
 * Alternating left/right message bubble placeholders for a conversation's
 * first load. `showAvatars` adds sender avatars to incoming bubbles (groups).
 */
export function ChatMessagesSkeleton({ showAvatars = false }: { showAvatars?: boolean }) {
  return (
    <SkeletonGroup label="Loading messages" style={styles.messages}>
      {BUBBLES.map((bubble, i) => (
        <View key={i} style={[styles.bubbleRow, bubble.mine ? styles.mine : styles.theirs]}>
          {showAvatars && !bubble.mine && <SkeletonCircle size={28} style={styles.avatar} />}
          <Skeleton width={bubble.width} height={bubble.height} radius={18} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

/**
 * Full-screen placeholder for a group conversation that hasn't loaded yet:
 * a real back button, a header placeholder, then message bubbles.
 */
export function GroupChatScreenSkeleton({ onBack }: { onBack: () => void }) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <SkeletonCircle size={40} />
        <View style={styles.headerText}>
          <Skeleton width={140} height={16} radius={8} />
          <Skeleton width={80} height={10} radius={5} />
        </View>
      </View>
      <ChatMessagesSkeleton showAvatars />
    </SafeAreaView>
  );
}

/** One placeholder matching a group row on the group chat list. */
function GroupRowSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.groupRow, { borderColor: colors.border }]}>
      <Skeleton width={48} height={48} radius={12} />
      <View style={styles.groupText}>
        <Skeleton width="55%" height={16} radius={8} />
        <Skeleton width="80%" height={12} radius={6} />
      </View>
      <SkeletonCircle size={18} />
    </View>
  );
}

/** Group row placeholders for the group chat list's first load. */
export function GroupListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <SkeletonGroup label="Loading communities">
      {Array.from({ length: count }).map((_, i) => (
        <GroupRowSkeleton key={i} />
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  messages: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  mine: {
    justifyContent: "flex-end",
  },
  theirs: {
    justifyContent: "flex-start",
  },
  avatar: {
    marginRight: 8,
  },
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backButton: {
    padding: 4,
  },
  headerText: {
    gap: 6,
  },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginTop: 4,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderRadius: 16,
  },
  groupText: {
    flex: 1,
    marginLeft: 14,
    gap: 6,
  },
});
