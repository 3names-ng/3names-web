import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { userService } from "@/service/profile.Service";
import { leaderboardService } from "@/service/leaderboard.Service";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { SafeAreaView } from "react-native-safe-area-context";
import LevelsSkeleton from "@/components/profile/levelsSkeleton";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { useLevelCacheStore } from "@/store/levelCacheStore";

export interface Level {
  id?: string;
  level: number;
  title: string;
  emoji: string;
  minXp: number;
  maxXp: number | null;
  badge: string;
  color: string;
  rewardCoins: number;
  perks: string[];
}

export interface UserLevelResponse {
  xp: number;
  level: Level;
  nextLevel?: Level | null;
  progress: number;
  totalXp: number;
}

type LevelStatus = "completed" | "current" | "locked";

export default function LevelsScreen() {
  // Offline cache (persisted to AsyncStorage) — shows the last-known levels
  // instantly while the network fetch runs in the background.
  const cachedUserLevel = useLevelCacheStore((state) => state.userLevel);
  const cachedLevels = useLevelCacheStore((state) => state.levels);
  const levelsCacheRehydrated = useLevelCacheStore((state) => state.rehydrated);
  const setCachedLevels = useLevelCacheStore((state) => state.setCachedLevels);

  // Fresh server data once it arrives; until then the cached copy is shown.
  const [fetchedUserLevel, setFetchedUserLevel] =
    useState<UserLevelResponse | null>(null);
  const [fetchedLevels, setFetchedLevels] = useState<Level[] | null>(null);
  const userLevelData = fetchedUserLevel ?? cachedUserLevel;
  const levels = fetchedLevels ?? cachedLevels;
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false);
  // Only a first visit with nothing cached waits on the network.
  const hasNothingToShow = !userLevelData && levels.length === 0;
  const isInitialLoad =
    hasNothingToShow && (loading || !levelsCacheRehydrated) && !refreshing;
  const showSkeleton = useDelayedLoading(isInitialLoad);

  // Theme extraction with fallbacks
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const themeColors = {
    background: colors?.background || (isDark ? "#0F0B1C" : "#F8FAFC"),
    cardBg: colors?.card || (isDark ? "#161224" : "#FFFFFF"),
    border: colors?.border || (isDark ? "#2D2640" : "#E2E8F0"),
    textPrimary: colors?.text || (isDark ? "#FFFFFF" : "#0F172A"),
    textSecondary: colors?.muted || (isDark ? "#9CA3AF" : "#64748B"),
    textMuted: isDark ? "#6B7280" : "#94A3B8",
    accent: colors?.primary || "#EC4899",
  };

  const fetchAllData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const [userLevelRes, levelsRes] = await Promise.all([
        userService.getUserLevel(),
        leaderboardService.getLevels(),
      ]);

      const nextLevels: Level[] = Array.isArray(levelsRes)
        ? levelsRes
        : levelsRes?.data || [];
      setFetchedUserLevel(userLevelRes);
      setFetchedLevels(nextLevels);
      setCachedLevels(userLevelRes, nextLevels);
    } catch (err: any) {
      console.error("Error fetching level data:", err);
      // Offline / network error — cached levels stay on screen, so only show
      // the error state when there's nothing to show.
      const cache = useLevelCacheStore.getState();
      if (!cache.userLevel && cache.levels.length === 0) {
        setError(err?.message || "Failed to load level progress.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Waits for the cache to rehydrate so the stale disk copy can't overwrite
  // the fresh server data afterwards.
  useEffect(() => {
    if (!levelsCacheRehydrated) return;
    fetchAllData();
  }, [levelsCacheRehydrated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData(true);
  };

  const currentLevelNum = userLevelData?.level?.level || 1;
  const currentXP = userLevelData?.totalXp || 0;
  const currentLevelObj = userLevelData?.level;
  
  const progressPercent = userLevelData
    ? Math.min(Math.max(userLevelData.progress * 100, 0), 100)
    : 0;

  const getLevelStatus = (lvlNumber: number): LevelStatus => {
    if (lvlNumber < currentLevelNum) return "completed";
    if (lvlNumber === currentLevelNum) return "current";
    return "locked";
  };

  const renderTimelineNode = (status: LevelStatus, color: string) => {
    if (status === "completed") {
      return (
        <View style={[styles.nodeCircle, { backgroundColor: "#10B981" }]}>
          <Feather name="check" size={14} color="#FFFFFF" />
        </View>
      );
    }
    if (status === "current") {
      return (
        <View style={[styles.nodeCircle, { backgroundColor: color }]}>
          <View style={styles.nodeCurrentInner} />
        </View>
      );
    }
    return (
      <View
        style={[
          styles.nodeCircle,
          {
            backgroundColor: isDark ? "#1F2937" : "#E2E8F0",
            borderColor: themeColors.border,
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons name="lock-closed" size={12} color={themeColors.textMuted} />
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: Level; index: number }) => {
    const status = getLevelStatus(item.level);
    const isCurrent = status === "current";
    const isCompleted = status === "completed";
    const isFirst = index === 0;
    const isLast = index === levels.length - 1;

    const inactiveLineColor = isDark ? "#1F2937" : "#E2E8F0";
    const lineAboveColor =
      isCompleted || isCurrent ? "#10B981" : inactiveLineColor;
    const lineBelowColor = isCompleted
      ? "#10B981"
      : isCurrent
        ? item.color
        : inactiveLineColor;

    return (
      <View style={styles.timelineRowContainer}>
        {/* Timeline Axis */}
        <View style={styles.timelineColumn}>
          {!isFirst && (
            <View
              style={[
                styles.lineSegment,
                styles.lineAbove,
                { backgroundColor: lineAboveColor },
              ]}
            />
          )}
          {!isLast && (
            <View
              style={[
                styles.lineSegment,
                styles.lineBelow,
                { backgroundColor: lineBelowColor },
              ]}
            />
          )}
          {renderTimelineNode(status, item.color)}
        </View>

        {/* Level Info Card */}
        <View
          style={[
            styles.levelCard,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: isCurrent ? item.color : themeColors.border,
            },
          ]}
        >
          {/* Badge Icon / Hexagon */}
          <View style={styles.badgeWrapper}>
            <MaterialCommunityIcons
              name="hexagon"
              size={56}
              color={
                isCompleted
                  ? "#10B98133"
                  : isCurrent
                    ? item.color + "33"
                    : isDark
                      ? "#1F2937"
                      : "#E2E8F0"
              }
            />
            <MaterialCommunityIcons
              name="hexagon-outline"
              size={56}
              color={
                isCompleted
                  ? "#10B981"
                  : isCurrent
                    ? item.color
                    : themeColors.border
              }
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.badgeIconCenter}>
              <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitleText}>
              <Text
                style={[styles.levelNumber, { color: themeColors.textPrimary }]}
              >
                Lv. {item.level}
              </Text>{" "}
              <Text
                style={[
                  styles.titleName,
                  {
                    color:
                      status === "locked"
                        ? themeColors.textMuted
                        : themeColors.textPrimary,
                  },
                ]}
              >
                {item.title}
              </Text>
            </Text>
            <Text
              style={[styles.xpRangeText, { color: themeColors.textSecondary }]}
            >
              {item.minXp.toLocaleString()} -{" "}
              {item.maxXp ? item.maxXp.toLocaleString() : "∞"} XP
            </Text>
            {item.perks?.length > 0 && (
              <Text
                style={[styles.perkText, { color: themeColors.textSecondary }]}
                numberOfLines={1}
              >
                🎁 {item.perks[0]}
              </Text>
            )}
          </View>

          {/* Pill Status */}
          <View
            style={[
              styles.statusPill,
              isCompleted && styles.pillCompleted,
              isCurrent && { backgroundColor: item.color + "22" },
              status === "locked" && {
                backgroundColor: isDark ? "rgba(31, 41, 55, 0.8)" : "#E2E8F0",
              },
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isCompleted && styles.pillTextCompleted,
                isCurrent && { color: item.color },
                status === "locked" && { color: themeColors.textMuted },
              ]}
            >
              {isCompleted ? "Completed" : isCurrent ? "Current" : "Locked"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={themeColors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>
          Levels & Progress
        </Text>
        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
            },
          ]}
          onPress={() => setInfoModalVisible(true)}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={themeColors.textPrimary}
          />
        </TouchableOpacity>
      </View>
      <Text
        style={[styles.headerSubtitle, { color: themeColors.textSecondary }]}
      >
        Level up, earn coins and unlock exclusive perks
      </Text>

      {isInitialLoad ? (
        // Empty for the first moment so fast responses don't flash a skeleton.
        showSkeleton ? <LevelsSkeleton /> : null
      ) : error ? (
        <View className="py-10 px-6 items-center justify-center bg-red-500/10 rounded-2xl border border-red-500/20 my-4 mx-4">
          <View className="w-12 h-12 rounded-full bg-red-500/20 items-center justify-center mb-3">
            <Feather name="alert-circle" size={24} color="#EF4444" />
          </View>
          <Text className="text-red-400 text-base font-bold text-center mb-1">
            Failed to Load Progress
          </Text>
          {/* <Text className="text-gray-400 text-xs text-center mb-4 leading-5">
                  {error}
                </Text> */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => fetchAllData()}
            className="flex-row items-center bg-red-500 px-4 py-2.5 rounded-xl space-x-2"
          >
            <Feather name="refresh-cw" size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-semibold ml-1.5">
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={levels}
          keyExtractor={(item) => item.id || item.level.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.accent}
            />
          }
          ListHeaderComponent={
            currentLevelObj ? (
              <LinearGradient
                colors={
                  isDark
                    ? ["#310E2A", "#1E1B4B", "#0F172A"]
                    : ["#FCE7F3", "#E0E7FF", "#F1F5F9"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.heroCard,
                  { borderColor: currentLevelObj.color },
                ]}
              >
                <View
                  style={[
                    styles.heroGlowBorder,
                    {
                      backgroundColor: isDark
                        ? "rgba(15, 11, 28, 0.85)"
                        : "rgba(255, 255, 255, 0.85)",
                    },
                  ]}
                >
                  
                  {/* Badge Frame */}
                  <View style={styles.heroBadgeWrapper}>
                    <MaterialCommunityIcons
                      name="hexagon"
                      size={86}
                      color={currentLevelObj.color + "33"}
                    />
                    <MaterialCommunityIcons
                      name="hexagon-outline"
                      size={86}
                      color={currentLevelObj.color}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.heroBadgeIconCenter}>
                      <Text style={{ fontSize: 36 }}>
                        {currentLevelObj.emoji}
                      </Text>
                    </View>
                  </View>

                  {/* Header Content */}
                  <View style={styles.heroContent}>
                    <View
                      style={[
                        styles.currentPill,
                        { backgroundColor: currentLevelObj.color + "22" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.currentPillText,
                          { color: currentLevelObj.color },
                        ]}
                      >
                        Your Current Level
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.heroLevelTitle,
                        { color: themeColors.textPrimary },
                      ]}
                    >
                      Lv. {currentLevelObj.level} {currentLevelObj.title}
                    </Text>

                    <Text
                      style={[
                        styles.xpText,
                        { color: themeColors.textSecondary },
                      ]}
                    >
                      <Text
                        style={{
                          color: currentLevelObj.color,
                          fontWeight: "800",
                        }}
                      >
                        {currentXP.toLocaleString()}
                      </Text>{" "}
                      /{" "}
                      {currentLevelObj.maxXp
                        ? currentLevelObj.maxXp.toLocaleString()
                        : "∞"}{" "}
                      XP
                    </Text>

                    {/* Dynamic Progress Bar */}
                    <View style={styles.progressRow}>
                      <View
                        style={[
                          styles.progressTrack,
                          { backgroundColor: isDark ? "#2D1F38" : "#E2E8F0" },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${progressPercent}%`,
                              backgroundColor: currentLevelObj.color,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.progressPercentage,
                          { color: currentLevelObj.color },
                        ]}
                      >
                        {progressPercent.toFixed(2)}%
                      </Text>
                    </View>

                    {currentLevelObj.perks?.length > 0 && (
                      <Text
                        style={[
                          styles.heroDescription,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        Unlocks: {currentLevelObj.perks.join(", ")}
                      </Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            ) : null
          }
        />
      )}

      {/* Footer Banner */}
      <View
        style={[
          styles.bottomBanner,
          {
            backgroundColor: themeColors.cardBg,
            borderColor: themeColors.border,
          },
        ]}
      >
        {/* <Ionicons
          name="sparkles-outline"
          size={14}
          color="#FACC15"
          style={{ marginRight: 6 }}
        /> */}
        <Text
          style={[
            styles.bottomBannerText,
            { color: themeColors.textSecondary },
          ]}
        >
          Earn{" "}
          <Text style={{ color: themeColors.accent, fontWeight: "700" }}>
            XP
          </Text>{" "}
          from interactions to level up and gain exclusive perks!
        </Text>
      </View>

      {/* Information Modal */}
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons
                name="information-circle"
                size={24}
                color={themeColors.accent}
              />
              <Text
                style={[styles.modalTitle, { color: themeColors.textPrimary }]}
              >
                How Levels Work
              </Text>
            </View>

            <View style={styles.modalBody}>
              <Text
                style={[styles.modalText, { color: themeColors.textSecondary }]}
              >
                •{" "}
                <Text
                  style={[styles.boldText, { color: themeColors.textPrimary }]}
                >
                  Earn XP:
                </Text>{" "}
                Complete daily activities and engage in app interactions to gain
                experience points.
              </Text>
              <Text
                style={[styles.modalText, { color: themeColors.textSecondary }]}
              >
                •{" "}
                <Text
                  style={[styles.boldText, { color: themeColors.textPrimary }]}
                >
                  Level Up:
                </Text>{" "}
                Reaching required XP unlocks higher levels automatically.
              </Text>
              <Text
                style={[styles.modalText, { color: themeColors.textSecondary }]}
              >
                •{" "}
                <Text
                  style={[styles.boldText, { color: themeColors.textPrimary }]}
                >
                  Unlock Rewards:
                </Text>{" "}
                Higher levels give you bonus coins, custom badges, and exclusive
                features.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.modalCloseButton,
                { backgroundColor: themeColors.accent },
              ]}
              onPress={() => setInfoModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },

  /* Hero Card */
  heroCard: {
    borderRadius: 20,
    padding: 1,
    marginBottom: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  heroGlowBorder: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 20,
  },
  heroBadgeWrapper: {
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  heroBadgeIconCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: { flex: 1 },
  currentPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  currentPillText: { fontSize: 11, fontWeight: "600" },
  heroLevelTitle: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  xpText: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginRight: 8,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  progressPercentage: { fontSize: 11, fontWeight: "700" },
  heroDescription: { fontSize: 11, lineHeight: 15 },

  /* Timeline */
  timelineRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timelineColumn: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  lineSegment: { position: "absolute", width: 2, left: 13 },
  lineAbove: { top: -12, height: "60%" },
  lineBelow: { bottom: -12, height: "60%" },
  nodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  nodeCurrentInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  /* Card Item */
  levelCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeWrapper: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  badgeIconCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  levelInfo: { flex: 1, paddingRight: 4 },
  levelTitleText: { fontSize: 14, marginBottom: 2 },
  levelNumber: { fontWeight: "800" },
  titleName: { fontWeight: "700" },
  xpRangeText: { fontSize: 11 },
  perkText: { fontSize: 11, marginTop: 2 },

  /* Status Pills */
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  pillCompleted: { backgroundColor: "rgba(16, 185, 129, 0.12)" },
  statusPillText: { fontSize: 10, fontWeight: "700" },
  pillTextCompleted: { color: "#10B981" },

  /* Bottom Banner */
  bottomBanner: {
    position: "absolute",
    bottom: 34,
    left: 20,
    right: 20,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBannerText: { fontSize: 11, textAlign: "center" },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  boldText: {
    fontWeight: "700",
  },
  modalCloseButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
