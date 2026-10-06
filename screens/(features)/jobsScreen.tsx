import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FlatList,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedView } from "@/components/ui/ThemedView";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { jobsService, Job } from "@/service/jobs.service";
import AuthHeader from "@/components/auth/authHeader";
import { JobListSkeleton } from "@/components/jobs/jobSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { useSyncSignal } from "@/hooks/useSyncSignal";
import { syncKeys } from "@/store/syncStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const JOB_TYPES = [
  { key: "", label: "All", icon: "grid" as const },
  { key: "full_time", label: "Full-Time", icon: "briefcase" as const },
  { key: "part_time", label: "Part-Time", icon: "time" as const },
  { key: "internship", label: "Internship", icon: "school" as const },
  { key: "remote", label: "Remote", icon: "globe" as const },
  { key: "contract", label: "Contract", icon: "document-text" as const },
  { key: "nysc", label: "NYSC", icon: "flag" as const },
  { key: "freelance", label: "Freelance", icon: "flash" as const },
];

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "#10B981",
  part_time: "#3B82F6",
  internship: "#8B5CF6",
  remote: "#F59E0B",
  contract: "#EC4899",
  nysc: "#EF4444",
  freelance: "#06B6D4",
};

const JOB_TYPE_GRADIENTS: Record<string, [string, string]> = {
  full_time: ["#10B981", "#059669"],
  part_time: ["#3B82F6", "#2563EB"],
  internship: ["#8B5CF6", "#7C3AED"],
  remote: ["#F59E0B", "#D97706"],
  contract: ["#EC4899", "#DB2777"],
  nysc: ["#EF4444", "#DC2626"],
  freelance: ["#06B6D4", "#0891B2"],
};

export default function JobsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchJobs = useCallback(
    async (pageNum = 1, reset = false) => {
      try {
        if (pageNum === 1 && !refreshing) setLoading(true);
        if (pageNum > 1) setLoadingMore(true);

        const result = await jobsService.listJobs({
          q: searchQuery || undefined,
          type: selectedType || undefined,
          page: pageNum,
          limit: 20,
        });

        setJobs((prev) =>
          reset || pageNum === 1 ? result.items : [...prev, ...result.items]
        );
        setTotalPages(result.totalPages);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, selectedType, refreshing]
  );

  useEffect(() => {
    fetchJobs(1, true);
  }, [selectedType]);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchJobs(1, true);
    }, 500);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  // A newly-posted job syncs in the background; refresh once it settles.
  useSyncSignal(syncKeys.jobs, () => fetchJobs(1, true));

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs(1, true);
  };

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchJobs(page + 1);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const renderJobCard = ({ item, index }: { item: Job; index: number }) => {
    const typeColor = JOB_TYPE_COLORS[item.type] || "#6B7280";
    const gradients = JOB_TYPE_GRADIENTS[item.type] || ["#6B7280", "#4B5563"];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/(features)/jobDetailScreen",
            params: { id: item.id },
          })
        }
        style={[styles.card, { marginTop: index === 0 ? 0 : 12 }]}
      >
        <LinearGradient
          colors={isDark ? ["#1E293B", "#0F172A"] : ["#FFFFFF", "#F8FAFC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.cardGradient,
            {
              borderColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.06)",
              shadowColor: typeColor,
              shadowOpacity: isDark ? 0.15 : 0.1,
              shadowRadius: 12,
            },
          ]}
        >
          {/* Top Section with Type Badge */}
          <View style={styles.cardTopSection}>
            <LinearGradient
              colors={gradients}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.typeBadgeGradient}
            >
              <ThemedText style={styles.typeBadgeText}>
                {item.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </ThemedText>
            </LinearGradient>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={12} color={colors.muted} />
              <ThemedText style={[styles.timeText, { color: colors.muted }]}>
                {timeAgo(item.createdAt)}
              </ThemedText>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.cardContent}>
            <View
              style={[
                styles.companyLogo,
                { backgroundColor: `${typeColor}15` },
              ]}
            >
              <LinearGradient
                colors={[`${typeColor}30`, `${typeColor}10`]}
                style={styles.logoGradient}
              >
                <ThemedText style={[styles.companyInitial, { color: typeColor }]}>
                  {item.company?.[0]?.toUpperCase() || "C"}
                </ThemedText>
              </LinearGradient>
            </View>

            <View style={styles.jobInfo}>
              <ThemedText style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
                {item.title}
              </ThemedText>
              <ThemedText style={[styles.companyName, { color: colors.muted }]}>
                {item.company}
              </ThemedText>
            </View>

            <View style={[styles.arrowContainer, { backgroundColor: `${typeColor}10` }]}>
              <Ionicons name="chevron-forward" size={18} color={typeColor} />
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            {item.location && (
              <View style={[styles.detailChip, { backgroundColor: `${colors.primary}10` }]}>
                <Ionicons name="location" size={13} color={colors.primary} />
                <ThemedText style={[styles.detailText, { color: colors.primary }]}>
                  {item.location}
                </ThemedText>
              </View>
            )}
            {item.salary && (
              <View style={[styles.detailChip, { backgroundColor: "#10B98115" }]}>
                <Ionicons name="cash" size={13} color="#10B981" />
                <ThemedText style={[styles.detailText, { color: "#10B981" }]}>
                  {item.salary}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={[styles.cardFooter, { borderTopColor: isDark ? "rgba(148,163,184,0.08)" : "rgba(0,0,0,0.04)" }]}>
            <View style={styles.footerLeft}>
              <Ionicons name="people-outline" size={14} color={colors.muted} />
              <ThemedText style={[styles.applicantText, { color: colors.muted }]}>
                {item.applicationsCount || 0} applicants
              </ThemedText>
            </View>
            <View style={[styles.postedByBadge, { backgroundColor: `${colors.primary}10` }]}>
              <ThemedText style={[styles.postedByText, { color: colors.primary }]}>
                View Details →
              </ThemedText>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header with Gradient */}
      {/* <LinearGradient
        colors={isDark ? ["#1E293B", "#0F172A"] : ["#F8FAFC", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.05)" }]}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
              Jobs
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: colors.muted }]}>
              {jobs.length} opportunities available
            </ThemedText>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(features)/postJobScreen")}
            style={styles.postBtn}
          >
            <LinearGradient
              colors={["#5B2EFF", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.postBtnGradient}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient> */}

      <AuthHeader 
  title={t("jobs.title")} 
  subtitle={t("jobs.subtitle")} 
/>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? "rgba(30,41,59,0.8)" : "rgba(248,250,252,0.9)",
              borderColor: isDark ? "rgba(148,163,184,0.15)" : "rgba(0,0,0,0.08)",
              shadowColor: "#000",
              shadowOpacity: isDark ? 0.2 : 0.06,
              shadowRadius: 8,
            },
          ]}
        >
          <View style={[styles.searchIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="search" size={16} color={colors.primary} />
          </View>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t("jobs.searchPlaceholder")}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={[styles.clearBtn, { backgroundColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(0,0,0,0.05)" }]}
            >
              <Ionicons name="close" size={16} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={JOB_TYPES}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isActive = selectedType === item.key;
            const chipColor = JOB_TYPE_COLORS[item.key] || colors.primary;

            return (
              <TouchableOpacity
                onPress={() => setSelectedType(item.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? `${chipColor}30`
                        : `${chipColor}15`
                      : isDark
                        ? "rgba(30,41,59,0.6)"
                        : "rgba(248,250,252,0.9)",
                    borderColor: isActive ? chipColor : isDark ? "rgba(148,163,184,0.15)" : "rgba(0,0,0,0.08)",
                    shadowColor: isActive ? chipColor : "transparent",
                    shadowOpacity: isActive ? 0.2 : 0,
                    shadowRadius: isActive ? 6 : 0,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={isActive ? chipColor : colors.muted}
                />
                <ThemedText
                  style={[
                    styles.filterText,
                    {
                      color: isActive ? chipColor : colors.muted,
                      fontWeight: isActive ? "700" : "500",
                    },
                  ]}
                >
                  {item.label}
                </ThemedText>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Job List */}
      {loading ? (
        showSkeleton ? <JobListSkeleton /> : null
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <ThemedText style={[styles.loadingMoreText, { color: colors.muted }]}>
                  Loading more...
                </ThemedText>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}10` }]}>
                <Ionicons name="briefcase-outline" size={48} color={colors.primary} />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
                No jobs found
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: colors.muted }]}>
                Try adjusting your search or filters to find what you're looking for
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setSelectedType("");
                }}
                style={[styles.emptyResetBtn, { backgroundColor: `${colors.primary}15` }]}
              >
                <ThemedText style={[styles.emptyResetText, { color: colors.primary }]}>
                  Clear Filters
                </ThemedText>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  postBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  postBtnGradient: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingLeft: 4,
  },
  searchIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  filterContainer: {
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 8,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
  },
  cardGradient: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  cardTopSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  typeBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  companyLogo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
  },
  logoGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  companyInitial: {
    fontSize: 20,
    fontWeight: "800",
  },
  jobInfo: {
    flex: 1,
    marginLeft: 14,
  },
  jobTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  companyName: {
    fontSize: 14,
    marginTop: 3,
    fontWeight: "500",
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  applicantText: {
    fontSize: 12,
    fontWeight: "500",
  },
  postedByBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  postedByText: {
    fontSize: 11,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyResetBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyResetText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
