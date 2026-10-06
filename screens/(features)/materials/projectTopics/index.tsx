import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import AuthHeader from "@/components/auth/authHeader";
import { ThemedText } from "@/components/ui/ThemedText";
import { ThemedView } from "@/components/ui/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { ProjectTopicsSkeleton } from "@/components/ui/skeletonPlaceholder";
import { useAuthStore } from "@/store/authStore";
import {
  projectTopicsService,
  ProjectTopic,
} from "@/service/projectTopics.service";
import { useProjectTopicCacheStore } from "@/store/projectTopicCacheStore";
import { useFocusEffect, useRouter } from "expo-router";

// ─── Constants ────────────────────────────────────────────────────────

const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Machine Learning / AI",
  "Data Science",
  "Networking & Security",
  "Database Systems",
  "Software Engineering",
  "Embedded Systems",
  "Cloud Computing",
  "Other",
];

const LEVELS = ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level"];

const ALL_CATEGORIES = ["All", ...CATEGORIES];
const ALL_LEVELS = ["All", ...LEVELS];

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
      }
    : null;

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
    // author,
    createdAt: item.createdAt || "",
  };
}

// ─── Topic Card ───────────────────────────────────────────────────────

function TopicCard({
  topic,
  colors,
  onPress,
}: {
  topic: ProjectTopic;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress?: () => void;
}) {
  const tags = topic.tags?.slice(0, 3) || [];

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={styles.topicHeader}>
        <View
          style={[
            styles.topicIcon,
            { backgroundColor: colors.dangerLight || "rgba(239,68,68,0.1)" },
          ]}
        >
          <MaterialCommunityIcons
            name="lightbulb-on"
            size={20}
            color={colors.danger || "#EF4444"}
          />
        </View>

        <View style={styles.topicTitleWrap}>
          <ThemedText style={styles.topicTitle} numberOfLines={2}>
            {topic.title}
          </ThemedText>
          {topic.courseCode ? (
            <ThemedText style={[styles.topicCourse, { color: colors.secondary }]}>
              {topic.courseCode}
              {topic.course ? ` — ${topic.course}` : ""}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {/* Description */}
      {topic.description ? (
        <ThemedText
          numberOfLines={3}
          style={styles.topicDescription}
        >
          {topic.description}
        </ThemedText>
      ) : null}

      {/* Tags */}
      {tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {tags.map((tag, idx) => (
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
      ) : null}

      {/* Footer stats */}
      <View style={[styles.topicFooter, { borderTopColor: colors.border }]}>
        <View style={styles.statRow}>
          <Ionicons
            name="arrow-up"
            size={14}
            color={topic.userVote === 'up' ? (colors.success || '#22C55E') : (colors.secondary || '#9CA3AF')}
          />
          <ThemedText
            style={[
              styles.statText,
              { color: topic.userVote === 'up' ? (colors.success || '#22C55E') : colors.secondary },
            ]}
          >
            {topic.upvotes ?? 0}
          </ThemedText>
        </View>

        <View style={styles.statRow}>
          <Ionicons
            name="arrow-down"
            size={14}
            color={topic.userVote === 'down' ? (colors.danger || '#EF4444') : (colors.secondary || '#9CA3AF')}
          />
          <ThemedText
            style={[
              styles.statText,
              { color: topic.userVote === 'down' ? (colors.danger || '#EF4444') : colors.secondary },
            ]}
          >
            {topic.downvotes ?? 0}
          </ThemedText>
        </View>

        <View style={styles.statRow}>
          <Ionicons name="eye-outline" size={14} color={colors.secondary || '#9CA3AF'} />
          <ThemedText style={[styles.statText, { color: colors.secondary }]}>
            {topic.views ?? 0}
          </ThemedText>
        </View>

        {/* {topic.author ? (
          <View style={styles.authorRow}>
            <ThemedText style={[styles.authorText, { color: colors.secondary }]}>
              by {topic.author.name || "Anonymous"}
            </ThemedText>
          </View>
        ) : null} */}
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────

function EmptyState({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={styles.emptyCard}>
      <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primaryLight || "rgba(124,58,237,0.08)" }]}>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={32} color={colors.primary || "#7C3AED"} />
      </View>
      <ThemedText style={styles.emptyTitle}>
        No project topics yet
      </ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Be the first to share a project topic with your department!
      </ThemedText>
    </View>
  );
}

function ErrorState({
  colors,
  onRetry,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  onRetry: () => void;
}) {
  return (
    <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: "#FCA5A5" }]}>
      <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
      <ThemedText style={styles.errorText}>
        Something went wrong loading project topics.
      </ThemedText>
      <TouchableOpacity style={styles.retryButton} activeOpacity={0.85} onPress={onRetry}>
        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Filter Chips ─────────────────────────────────────────────────────

function FilterChipRow({
  label,
  options,
  selected,
  onSelect,
  colors,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.chipSection}>
      <ThemedText style={[styles.chipLabel, { color: colors.secondary }]}>
        {label}
      </ThemedText>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScrollContent}
      >
        {options.map((option) => {
          const isActive = selected === option;
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.8}
              onPress={() => onSelect(option)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive
                    ? colors.primary || "#7C3AED"
                    : colors.card,
                  borderColor: isActive
                    ? colors.primary || "#7C3AED"
                    : colors.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.chipText,
                  { color: isActive ? "#FFFFFF" : colors.text },
                ]}
              >
                {option}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────

export default function ProjectTopicsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const [topics, setTopics] = useState<ProjectTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 15;

  // Filters
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");

  // Offline cache (persisted to AsyncStorage) — lets topics display without network
  const topicsByKey = useProjectTopicCacheStore((state) => state.topicsByKey);
  const topicsCacheRehydrated = useProjectTopicCacheStore(
    (state) => state.rehydrated
  );
  const setCachedTopics = useProjectTopicCacheStore(
    (state) => state.setCachedTopics
  );

  // Cache key for the current filter set
  const cacheKey = [searchText.trim(), selectedCategory, selectedLevel].join("|");

  /** Fetch page 1 — resets the list */
  const fetchFirstPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: 1,
        limit: pageSize,
      };

      if (searchText.trim()) params.search = searchText.trim();
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (selectedLevel !== "All") params.level = selectedLevel;

      const response = await projectTopicsService.listDepartment(params);

      const items = Array.isArray(response) ? response : response?.items || [];
      const mapped: ProjectTopic[] = items.map(mapTopic);

      setTopics(mapped);
      setPage(1);
      setTotalPages(response?.totalPages ?? Math.ceil((response?.total ?? 0) / pageSize));
      // Keep a local snapshot so topics still show when offline
      setCachedTopics(cacheKey, mapped);
    } catch (err: any) {
      console.error("[ProjectTopicsScreen] Error:", {
        message: err?.message,
        status: err?.response?.status,
      });
      setError(err?.message || "Failed to load project topics.");
    } finally {
      setLoading(false);
    }
  }, [searchText, selectedCategory, selectedLevel, cacheKey, setCachedTopics]);

  /** Fetch next page — appends to the list */
  const fetchMore = useCallback(async () => {
    if (loadingMore || loading) return;
    if (page >= totalPages) return;

    try {
      setLoadingMore(true);

      const nextPage = page + 1;
      const params: Record<string, any> = {
        page: nextPage,
        limit: pageSize,
      };

      if (searchText.trim()) params.search = searchText.trim();
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (selectedLevel !== "All") params.level = selectedLevel;

      const response = await projectTopicsService.listDepartment(params);

      const items = Array.isArray(response) ? response : response?.items || [];
      const mapped: ProjectTopic[] = items.map(mapTopic);

      setTopics((prev) => [...prev, ...mapped]);
      setPage(nextPage);
      setTotalPages(response?.totalPages ?? totalPages);
    } catch (err: any) {
      console.error("[ProjectTopicsScreen] Load more error:", err?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [page, totalPages, loadingMore, loading, searchText, selectedCategory, selectedLevel]);

  // Refetch when filters change
  useFocusEffect(
    useCallback(() => {
      fetchFirstPage();
    }, [fetchFirstPage]),
  );

  // Show persisted topics immediately (works offline) while the network fetch runs
  useEffect(() => {
    if (!topicsCacheRehydrated || topics.length > 0) return;
    const cached = topicsByKey[cacheKey] || [];
    if (cached.length > 0) {
      setTopics(cached);
    }
  }, [topicsCacheRehydrated, topicsByKey, cacheKey, topics.length]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFirstPage();
    setRefreshing(false);
  };

  const handleSearchSubmit = () => {
    fetchFirstPage();
  };

  const handleClearFilters = () => {
    setSearchText("");
    setSelectedCategory("All");
    setSelectedLevel("All");
    // fetchFirstPage will fire via useFocusEffect dependency
  };

  const hasActiveFilters =
    searchText.trim() !== "" ||
    selectedCategory !== "All" ||
    selectedLevel !== "All";

  // List header with search + filters
  const ListHeader = (
    <View>
      {/* Search Bar */}
      <View
        style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Ionicons name="search" size={18} color={colors.secondary || "#9CA3AF"} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search topics, courses, tags..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchText(""); }}>
            <Ionicons name="close-circle" size={18} color={colors.secondary || "#9CA3AF"} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips */}
      {/* <FilterChipRow
        label="Category"
        options={ALL_CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        colors={colors}
      /> */}

      {/* Level Chips */}
      {/* <FilterChipRow
        label="Level"
        options={ALL_LEVELS}
        selected={selectedLevel}
        onSelect={setSelectedLevel}
        colors={colors}
      /> */}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <TouchableOpacity
          style={styles.clearFiltersBtn}
          onPress={handleClearFilters}
        >
          <Ionicons name="filter" size={14} color={colors.primary || "#7C3AED"} />
          <ThemedText style={[styles.clearFiltersText, { color: colors.primary || "#7C3AED" }]}>
            Clear filters
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Results count */}
      {!loading && !error && (
        <ThemedText style={[styles.resultsCount, { color: colors.secondary }]}>
          {topics.length} {topics.length === 1 ? "topic" : "topics"} found
          {totalPages > 1 ? ` (page ${page} of ${totalPages})` : ""}
        </ThemedText>
      )}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="default" />

        <AuthHeader
          title="Project Topics"
          subtitle={
            user?.departmentName
              ? `${user.departmentName} department`
              : "Browse research ideas"
          }
        />

        {loading && topics.length === 0 ? (
          <ProjectTopicsSkeleton count={4} />
        ) : error && topics.length === 0 ? (
          <FlatList
            data={[]}
            renderItem={() => null}
            ListHeaderComponent={
              <View>
                {ListHeader}
                <ErrorState colors={colors} onRetry={fetchFirstPage} />
              </View>
            }
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />
            }
          />
        ) : (
          <FlatList
            data={topics}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TopicCard
                topic={item}
                colors={colors}
                onPress={() => router.push({
                  pathname: "/(features)/materials/projectTopics/projectTopicDetail",
                  params: { id: item.id },
                })}
              />
            )}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={<EmptyState colors={colors} />}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadMoreFooter}>
                  <ActivityIndicator size="small" color="#7C3AED" />
                  <ThemedText style={[styles.loadMoreText, { color: colors.secondary }]}>
                    Loading more...
                  </ThemedText>
                </View>
              ) : page >= totalPages && topics.length > 0 ? (
                <View style={styles.loadMoreFooter}>
                  <ThemedText style={[styles.loadMoreText, { color: colors.secondary }]}>
                    You've reached the end
                  </ThemedText>
                </View>
              ) : null
            }
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onEndReached={fetchMore}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#7C3AED" />
            }
          />
        )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary || "#7C3AED", shadowColor: colors.primary || "#7C3AED" }]}
        onPress={() => router.push("/(features)/materials/projectTopics/addProjectTopic")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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

  // Search Bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },

  // Filter Chips
  chipSection: {
    marginTop: 6,
    marginBottom: 2,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  chipScrollContent: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Clear filters
  clearFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    marginBottom: 4,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Results count
  resultsCount: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },

  // Load more footer
  loadMoreFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 50,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },

  // Topic Card
  topicCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  topicTitleWrap: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  topicCourse: {
    fontSize: 12,
    marginTop: 2,
  },
  topicDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    opacity: 0.7,
  },

  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Footer
  topicFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  authorRow: {
    marginLeft: "auto",
  },
  authorText: {
    fontSize: 11,
    fontStyle: "italic",
  },

  // Empty
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  // Error
  errorCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    height: 40,
    paddingHorizontal: 24,
    backgroundColor: "#EF4444",
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
