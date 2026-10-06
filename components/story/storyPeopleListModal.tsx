import React from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import getRelativeTime from "@/service/helper";
import { usePaginatedList, PaginatedPage } from "@/hooks/usePaginatedList";
import { LevelBadge, AppLevel } from "../levelBadge";
import { ProfileFrame } from "../ui/ProfileFrame";

export interface StoryListPerson {
  id: string;
  username: string | null;
  profilePictureUrl: string | null;
  profileFrame?: string | null;
  level: Partial<AppLevel> | null;
  timestamp: string;
  /** Present for a reactions list, absent for a plain viewers list. */
  emoji?: string;
  /** Present for a gifters list, e.g. "Rose · 20 coins". */
  giftLabel?: string;
}

interface StoryPeopleListModalProps {
  visible: boolean;
  title: string;
  emptyText: string;
  fetchPage: (cursor: string | null) => Promise<PaginatedPage<StoryListPerson>>;
  onClose: () => void;
}

function personDisplayName(person: StoryListPerson): string {
  return person.username ? `@${person.username}` : "Unknown user";
}

export default function StoryPeopleListModal({
  visible,
  title,
  emptyText,
  fetchPage,
  onClose,
}: StoryPeopleListModalProps) {
  const { colors } = useTheme();
  const { items, loading, loadingMore, loadMore } = usePaginatedList(visible, fetchPage);
  const people = items ?? [];

  function goToProfile(person: StoryListPerson) {
    onClose();
    router.push({
      pathname: "/(features)/userProfile/[id]",
      params: { id: person.id },
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ThemedView style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <SafeAreaView style={[styles.sheet, { backgroundColor: colors.background }]}>
          <ThemedView style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
              {title} {people.length > 0 ? people.length : ""}
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <Text style={[styles.closeButtonText, { color: colors.muted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="small" color={colors.muted} />
            </View>
          ) : people.length === 0 ? (
            <View style={styles.centerState}>
              <ThemedText style={{ color: colors.muted }}>{emptyText}</ThemedText>
            </View>
          ) : (
            <FlatList
              data={people}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable style={styles.row} onPress={() => goToProfile(item)}>
                  <ProfileFrame
                    frameId={item.profileFrame}
                    uri={item.profilePictureUrl}
                    size={42}
                    initial={(item.username || "?").charAt(0).toUpperCase()}
                  />
                  <View style={styles.rowText}>
                    <ThemedText style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                      {personDisplayName(item)}
                    </ThemedText>
                    {item.level?.badge ? (
                      <LevelBadge level={item.level} containerStyle={styles.levelBadge} />
                    ) : null}
                  </View>
                  {item.giftLabel ? (
                    <ThemedText
                      style={[styles.giftLabel, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      🎁 {item.giftLabel}
                    </ThemedText>
                  ) : null}
                  {item.emoji ? <Text style={styles.emoji}>{item.emoji}</Text> : null}
                  <ThemedText style={[styles.timeAgo, { color: colors.muted }]}>
                    {getRelativeTime(item.timestamp)}
                  </ThemedText>
                </Pressable>
              )}
              contentContainerStyle={styles.listContent}
              onEndReached={loadMore}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.footerLoading}>
                    <ActivityIndicator size="small" color={colors.muted} />
                  </View>
                ) : null
              }
            />
          )}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backdropTouch: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "72%",
    minHeight: "40%",
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  centerState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoading: {
    paddingVertical: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
  },
  levelBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  giftLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 8,
    maxWidth: 100,
  },
  timeAgo: {
    fontSize: 12,
    marginLeft: 8,
  },
});
