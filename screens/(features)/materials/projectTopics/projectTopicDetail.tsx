import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";

import AuthHeader from "@/components/auth/authHeader";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/authStore";
import { showError, showSuccess } from "@/components/ui/toast";
import { TopicDetailSkeleton } from "@/components/ui/skeletonPlaceholder";
import {
  projectTopicsService,
  ProjectTopic,
} from "@/service/projectTopics.service";
import { useProjectTopicCacheStore } from "@/store/projectTopicCacheStore";

// ─── Helpers ──────────────────────────────────────────────────────────

function mapTopic(item: any): ProjectTopic {
  const authorRaw = item.author || item.uploader || null;
  const author = authorRaw
    ? {
        id: authorRaw.id,
        name:
          authorRaw.name ||
          [authorRaw.firstName, authorRaw.lastName].filter(Boolean).join(" ") ||
          authorRaw.username ||
          "Anonymous",
        avatar: authorRaw.avatar || authorRaw.profilePictureUrl || null,
      }      : undefined;

  return {
    id: item.id,
    title: item.title || "Untitled Topic",
    description: item.description || "",
    department: item.department || "",
    course: item.course || "",
    courseCode: item.courseCode || "",
    level: item.level || "",
    category: item.category || "",
    tags: item.tags || [],
    status: item.status || "active",
    upvotes: item.upvotes ?? 0,
    downvotes: item.downvotes ?? 0,
    views: item.views ?? 0,
    userVote: item.userVote ?? null,
    author,
    createdAt: item.createdAt || "",
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────

export default function ProjectTopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  // Offline cache (persisted to AsyncStorage) — lets topic details show without network
  const topicsByKey = useProjectTopicCacheStore((state) => state.topicsByKey);
  const topicsCacheRehydrated = useProjectTopicCacheStore(
    (state) => state.rehydrated
  );

  const [topic, setTopic] = useState<ProjectTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const findCachedTopic = useCallback(() => {
    return Object.values(topicsByKey)
      .flat()
      .find((t) => t.id === id) || null;
  }, [topicsByKey, id]);

  const fetchTopic = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const raw = await projectTopicsService.findById(id);
      setTopic(mapTopic(raw));
    } catch (err: any) {
      console.error("[ProjectTopicDetail] Error:", err?.message);
      // Offline / network error — fall back to the cached copy from the list
      const cached = findCachedTopic();
      if (cached) {
        setTopic(cached);
        setError(null);
      } else {
        setError(err?.message || "Failed to load project topic.");
      }
    } finally {
      setLoading(false);
    }
  }, [id, findCachedTopic]);

  // If the fetch failed before the cache rehydrated, show the cached copy once it's ready
  useEffect(() => {
    if (!topicsCacheRehydrated || topic || !error) return;
    const cached = findCachedTopic();
    if (cached) {
      setTopic(cached);
      setError(null);
    }
  }, [topicsCacheRehydrated, topic, error, findCachedTopic]);

  useFocusEffect(
    useCallback(() => {
      fetchTopic();
    }, [fetchTopic]),
  );

  const [voting, setVoting] = useState(false);

  const handleUpvote = async () => {
    if (!topic || voting) return;
    try {
      setVoting(true);
      const result = await projectTopicsService.upvote(topic.id);
      setTopic((prev) =>
        prev
          ? { ...prev, upvotes: result.upvotes, downvotes: result.downvotes, userVote: result.userVote }
          : prev,
      );
    } catch (err: any) {
      showError(err?.message || "Failed to upvote.");
    } finally {
      setVoting(false);
    }
  };

  const handleDownvote = async () => {
    if (!topic || voting) return;
    try {
      setVoting(true);
      const result = await projectTopicsService.downvote(topic.id);
      setTopic((prev) =>
        prev
          ? { ...prev, upvotes: result.upvotes, downvotes: result.downvotes, userVote: result.userVote }
          : prev,
      );
    } catch (err: any) {
      showError(err?.message || "Failed to downvote.");
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = () => {
    if (!topic) return;
    Alert.alert(
      "Delete Topic",
      "Are you sure you want to delete this project topic? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await projectTopicsService.remove(topic.id);
              showSuccess("Project topic deleted.");
              router.back();
            } catch (err: any) {
              showError(err?.message || "Failed to delete topic.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const isAuthor = currentUser?.id && topic?.author?.id === currentUser.id;

  // ── Loading ─────────────────────────────────────────────────────

  if (loading && !topic) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="default" />
          <AuthHeader title="Topic Details" subtitle="" />
          <TopicDetailSkeleton colors={colors} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Error ───────────────────────────────────────────────────────

  if (error || !topic) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="default" />
          <AuthHeader title="Topic Details" subtitle="" />
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
            <ThemedText style={[styles.errorText, { color: colors.text }]}>
              {error || "Topic not found."}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary || "#7C3AED" }]}
              onPress={fetchTopic}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="default" />

        <AuthHeader
          title="Topic Details"
          subtitle={topic.courseCode || topic.category || ""}
          rightElement={
            isAuthor ? (
              <TouchableOpacity
                onPress={handleDelete}
                disabled={deleting}
                style={styles.headerDeleteBtn}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                )}
              </TouchableOpacity>
            ) : undefined
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* ── Title Section ──────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.titleIcon,
                  { backgroundColor: colors.dangerLight || "rgba(239,68,68,0.1)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="lightbulb-on"
                  size={24}
                  color={colors.danger || "#EF4444"}
                />
              </View>
              <ThemedText style={styles.titleText}>{topic.title}</ThemedText>
            </View>

            {/* Meta chips */}
            <View style={styles.metaChips}>
              {topic.level ? (
                <View style={[styles.metaChip, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
                  <Ionicons name="bar-chart-outline" size={12} color={colors.primary || "#7C3AED"} />
                  <ThemedText style={[styles.metaChipText, { color: colors.primary || "#7C3AED" }]}>
                    {topic.level}
                  </ThemedText>
                </View>
              ) : null}
              {topic.category ? (
                <View style={[styles.metaChip, { backgroundColor: colors.infoLight || "rgba(59,130,246,0.08)" }]}>
                  <Ionicons name="folder-outline" size={12} color={colors.info || "#3B82F6"} />
                  <ThemedText style={[styles.metaChipText, { color: colors.info || "#3B82F6" }]}>
                    {topic.category}
                  </ThemedText>
                </View>
              ) : null}
              {topic.courseCode ? (
                <View style={[styles.metaChip, { backgroundColor: colors.warningLight || "rgba(245,158,11,0.08)" }]}>
                  <Ionicons name="code-slash-outline" size={12} color={colors.warning || "#F59E0B"} />
                  <ThemedText style={[styles.metaChipText, { color: colors.warning || "#F59E0B" }]}>
                    {topic.courseCode}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Description ────────────────────────────────── */}
          {topic.description ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.sectionLabel, { color: colors.secondary }]}>
                Description
              </ThemedText>
              <ThemedText style={styles.descriptionText}>
                {topic.description}
              </ThemedText>
            </View>
          ) : null}

          {/* ── Tags ───────────────────────────────────────── */}
          {topic.tags && topic.tags.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.sectionLabel, { color: colors.secondary }]}>
                Tags
              </ThemedText>
              <View style={styles.tagsRow}>
                {topic.tags.map((tag, idx) => (
                  <View
                    key={idx}
                    style={[styles.tag, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}
                  >
                    <ThemedText style={[styles.tagText, { color: colors.primary || "#7C3AED" }]}>
                      {tag}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* ── Author ─────────────────────────────────────── */}
          {topic.author ? (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ThemedText style={[styles.sectionLabel, { color: colors.secondary }]}>
                Submitted by
              </ThemedText>
              <View style={styles.authorRow}>
                <View style={[styles.authorAvatar, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
                  <Ionicons name="person" size={20} color={colors.primary || "#7C3AED"} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.authorName}>
                    {topic.author.name || "Anonymous"}
                  </ThemedText>
                  {topic.createdAt ? (
                    <ThemedText style={[styles.authorDate, { color: colors.secondary }]}>
                      {formatDate(topic.createdAt)}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          {/* ── Stats ──────────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={[styles.sectionLabel, { color: colors.secondary }]}>
              Stats
            </ThemedText>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={topic.userVote === 'up' ? (colors.success || '#22C55E') : (colors.secondary || '#9CA3AF')}
                />
                <ThemedText
                  style={[
                    styles.statValue,
                    { color: topic.userVote === 'up' ? (colors.success || '#22C55E') : colors.text },
                  ]}
                >
                  {topic.upvotes}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.secondary }]}>
                  Upvotes
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Ionicons
                  name="arrow-down"
                  size={20}
                  color={topic.userVote === 'down' ? (colors.danger || '#EF4444') : (colors.secondary || '#9CA3AF')}
                />
                <ThemedText
                  style={[
                    styles.statValue,
                    { color: topic.userVote === 'down' ? (colors.danger || '#EF4444') : colors.text },
                  ]}
                >
                  {topic.downvotes}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.secondary }]}>
                  Downvotes
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={20} color={colors.info || '#3B82F6'} />
                <ThemedText style={[styles.statValue, { color: colors.text }]}>
                  {topic.views}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: colors.secondary }]}>
                  Views
                </ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Bottom Vote Bar ────────────────────────────── */}
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.voteButtonsRow}>
            {/* Upvote button */}
            <TouchableOpacity
              style={[
                styles.voteButton,
                topic.userVote === 'up'
                  ? { backgroundColor: colors.success || '#22C55E' }
                  : { backgroundColor: colors.background, borderColor: colors.border },
                voting && styles.voteButtonDisabled,
              ]}
              onPress={handleUpvote}
              disabled={voting}
              activeOpacity={0.85}
            >
              {voting ? (
                <ActivityIndicator size="small" color={topic.userVote === 'up' ? '#FFFFFF' : (colors.primary || '#7C3AED')} />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={topic.userVote === 'up' ? '#FFFFFF' : (colors.primary || '#7C3AED')}
                />
              )}
              <ThemedText
                style={[
                  styles.voteButtonText,
                  { color: topic.userVote === 'up' ? '#FFFFFF' : (colors.text || '#1F2937') },
                ]}
              >
                {topic.upvotes}
              </ThemedText>
            </TouchableOpacity>

            {/* Downvote button */}
            <TouchableOpacity
              style={[
                styles.voteButton,
                topic.userVote === 'down'
                  ? { backgroundColor: colors.danger || '#EF4444' }
                  : { backgroundColor: colors.background, borderColor: colors.border },
                voting && styles.voteButtonDisabled,
              ]}
              onPress={handleDownvote}
              disabled={voting}
              activeOpacity={0.85}
            >
              {voting ? (
                <ActivityIndicator size="small" color={topic.userVote === 'down' ? '#FFFFFF' : (colors.primary || '#7C3AED')} />
              ) : (
                <Ionicons
                  name="arrow-down"
                  size={20}
                  color={topic.userVote === 'down' ? '#FFFFFF' : (colors.primary || '#7C3AED')}
                />
              )}
              <ThemedText
                style={[
                  styles.voteButtonText,
                  { color: topic.userVote === 'down' ? '#FFFFFF' : (colors.text || '#1F2937') },
                ]}
              >
                {topic.downvotes}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  // Header delete button
  headerDeleteBtn: {
    padding: 8,
    marginRight: 4,
  },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },

  // Title section
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },

  // Meta chips
  metaChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Description
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.85,
  },

  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Author
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "700",
  },
  authorDate: {
    fontSize: 12,
    marginTop: 2,
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 32,
  },

  // Bottom bar
  bottomBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 28,
  },
  voteButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    gap: 8,
  },
  voteButtonDisabled: {
    opacity: 0.7,
  },
  voteButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Error
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
