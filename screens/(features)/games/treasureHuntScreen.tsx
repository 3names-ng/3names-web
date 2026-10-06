import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import AuthHeader from "@/components/auth/authHeader";
import { RecentClaimsSkeleton } from "@/components/games/gameSkeletons";
import { useDelayedLoading } from "@/components/ui/skeleton";
import { ThemedText } from "@/components/ui/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import {
  treasureHuntService,
  type RecentClaim,
} from "@/service/treasureHunt.service";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Search the App",
    description:
      "Explore different screens to find the hidden Mystery Box. It appears once a week!",
    color: "#6366F1",
    icon: "search" as const,
  },
  {
    step: 2,
    title: "Tap the Box",
    description:
      "When you spot the Mystery Box, tap it quickly before it disappears!",
    color: "#8B5CF6",
    icon: "hand-left" as const,
  },
  {
    step: 3,
    title: "Claim Your Gift",
    description:
      "Open the box to reveal your surprise reward. Could be Stars, gifts, or something rare!",
    color: "#D946EF",
    icon: "gift" as const,
  },
];

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function TreasureHuntScreen() {
  const { colors, isDark } = useTheme();

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [huntStarted] = useState(true);
  const [recentClaims, setRecentClaims] = useState<RecentClaim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const showClaimsSkeleton = useDelayedLoading(loadingClaims);

  // Fetch recent claims
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const { claims } = await treasureHuntService.getRecentClaims(10);
        if (!cancelled) setRecentClaims(claims);
      } catch (err) {
        console.error("Failed to load recent claims:", err);
      } finally {
        if (!cancelled) setLoadingClaims(false);
      }
    }
    fetch();
    return () => {
      cancelled = true;
    };
  }, []);

  // Countdown to next Sunday
  useEffect(() => {
    const getNextSunday = () => {
      const now = new Date();
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(23, 59, 59, 999);
      return nextSunday;
    };

    const updateCountdown = () => {
      const target = getNextSunday();
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  const getUserDisplayName = (user: RecentClaim["user"]) => {
    return user.username || "Someone";
  };

  const getRewardText = (claim: RecentClaim) => {
    const parts: string[] = [];
    if (claim.gift) parts.push(claim.gift.name);
    if (claim.gift && claim.gift.bonusCoins > 0)
      parts.push(`+${claim.gift.bonusCoins} Stars`);
    return parts.length > 0 ? parts.join(" ") : claim.huntName;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <AuthHeader
        title="Treasure Hunt"
        subtitle="Find the Mystery Box every week!"
        showBackButton={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Hero Banner ─── */}
        <View
          style={[
            styles.heroBanner,
            { backgroundColor: isDark ? "#1A1035" : "#F5F0FF" },
          ]}
        >
          <FloatingEmojis />
          <ShimmerGlow />
          <PulseChest />

          <ThemedText style={styles.heroTitle}>Weekly Mystery Box</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            A mysterious gift box is hidden somewhere in the app. Find it and
            claim your surprise reward!
          </ThemedText>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: huntStarted ? "#10B981" : "#F59E0B" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: huntStarted ? "#34D399" : "#FBBF24" },
              ]}
            />
            <ThemedText style={styles.statusText}>
              {huntStarted
                ? "Box is Hidden — Go Find It!"
                : "No hunt running right now"}
            </ThemedText>
          </View>
        </View>

        {/* ─── Countdown ─── */}
        <View
          style={[
            styles.countdownSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.countdownHeader}>
            <Ionicons name="time-outline" size={20} color="#A78BFA" />
            <ThemedText style={styles.countdownTitle}>
              Box Refreshes In
            </ThemedText>
          </View>
          <View style={styles.countdownGrid}>
            {[
              { value: countdown.days, label: "Days" },
              { value: countdown.hours, label: "Hours" },
              { value: countdown.minutes, label: "Mins" },
              { value: countdown.seconds, label: "Secs" },
            ].map((item) => (
              <View key={item.label} style={styles.countdownItem}>
                <View
                  style={[
                    styles.countdownValueBox,
                    { backgroundColor: isDark ? "#312E81" : "#EEF2FF" },
                  ]}
                >
                  <ThemedText style={styles.countdownValue}>
                    {formatNumber(item.value)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.countdownLabel}>
                  {item.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* ─── What's Inside ─── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={22} color="#F59E0B" />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              What's Inside the Box?
            </ThemedText>
          </View>

          <View style={styles.rewardsRow}>
            {[
              { emoji: "⭐", label: "Bonus Stars", color: "#F59E0B" },
              { emoji: "🎁", label: "Gift Boxes", color: "#8B5CF6" },
              { emoji: "💎", label: "Rare Items", color: "#EC4899" },
              { emoji: "⭐", label: "XP Boost", color: "#10B981" },
            ].map((item) => (
              <View
                key={item.label}
                style={[styles.rewardPill, { borderColor: item.color + "40" }]}
              >
                <ThemedText style={styles.rewardEmoji}>{item.emoji}</ThemedText>
                <ThemedText
                  style={[styles.rewardLabel, { color: colors.text }]}
                >
                  {item.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* ─── How It Works ─── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="compass-outline"
              size={22}
              color={colors.primary}
            />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              How It Works
            </ThemedText>
          </View>

          <View style={styles.stepsContainer}>
            {HOW_IT_WORKS.map((step, index) => (
              <View
                key={step.step}
                style={[
                  styles.stepCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.stepIconWrap,
                    { backgroundColor: step.color + "20" },
                  ]}
                >
                  <Ionicons name={step.icon} size={20} color={step.color} />
                </View>
                <View style={styles.stepContent}>
                  <ThemedText
                    style={[styles.stepTitle, { color: colors.text }]}
                  >
                    {step.title}
                  </ThemedText>
                  <ThemedText
                    style={[styles.stepDescription, { color: colors.muted }]}
                  >
                    {step.description}
                  </ThemedText>
                </View>
                {index < HOW_IT_WORKS.length - 1 && (
                  <View style={styles.stepConnector}>
                    <View
                      style={[
                        styles.connectorLine,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* ─── Recent Finds ─── */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={22} color="#34D399" />
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Finds
            </ThemedText>
          </View>

          {loadingClaims ? (
            showClaimsSkeleton ? (
              <RecentClaimsSkeleton />
            ) : null
          ) : recentClaims.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search-outline" size={32} color={colors.muted} />
              <ThemedText style={[styles.emptyText, { color: colors.muted }]}>
                No finds yet — be the first to discover the Mystery Box!
              </ThemedText>
            </View>
          ) : (
            <View style={styles.winnersList}>
              {recentClaims.map((claim) => (
                <View
                  key={claim.id}
                  style={[
                    styles.winnerCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {claim.user.profilePictureUrl ? (
                    <Image
                      source={{ uri: claim.user.profilePictureUrl }}
                      style={styles.winnerAvatarImg}
                    />
                  ) : (
                    <View
                      style={[
                        styles.winnerAvatar,
                        { backgroundColor: "#6366F1" + "20" },
                      ]}
                    >
                      <ThemedText style={styles.winnerInitial}>
                        {getUserDisplayName(claim.user)[0]?.toUpperCase() ||
                          "?"}
                      </ThemedText>
                    </View>
                  )}
                  <View style={styles.winnerInfo}>
                    <ThemedText
                      style={[styles.winnerName, { color: colors.text }]}
                    >
                      {getUserDisplayName(claim.user)}
                    </ThemedText>
                    <ThemedText
                      style={[styles.winnerReward, { color: colors.muted }]}
                    >
                      📦 {getRewardText(claim)}
                    </ThemedText>
                  </View>
                  <View style={styles.winnerRight}>
                    {claim.bonusCoins > 0 && (
                      <View style={styles.coinBadge}>
                        <Ionicons name="sparkles" size={12} color="#F59E0B" />
                        <ThemedText style={styles.coinText}>
                          +{claim.bonusCoins}
                        </ThemedText>
                      </View>
                    )}
                    <ThemedText
                      style={[styles.winnerTime, { color: colors.muted }]}
                    >
                      {timeAgo(claim.claimedAt)}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Tips ─── */}
        <View
          style={[
            styles.tipBanner,
            {
              backgroundColor: isDark ? "#1E293B" : "#F0F4FF",
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
          <ThemedText style={[styles.tipText, { color: colors.muted }]}>
            The Mystery Box appears on a random screen each week. Keep exploring
            to increase your chances of finding it!
          </ThemedText>
        </View>

        {/* ─── CTA ─── */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.85}
            onPress={() => {
              // Navigate to the main app screen or trigger the search action
              router.push("/(tabs)");
            }}
          >
            <Ionicons name="search" size={22} color="#FFFFFF" />
            <ThemedText style={styles.ctaButtonText}>
              Start Searching!
            </ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.ctaNote, { color: colors.muted }]}>
            A new box resets every Monday
          </ThemedText>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Animated sub-components ───

function PulseChest() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.chestContainer, animatedStyle]}>
      <View style={styles.chestCircle}>
        <ThemedText style={styles.chestEmoji}>📦</ThemedText>
      </View>
    </Animated.View>
  );
}

function FloatingEmojis() {
  const y1 = useSharedValue(0);
  const y2 = useSharedValue(0);
  const y3 = useSharedValue(0);

  useEffect(() => {
    y1.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    y2.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    y3.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const s1 = useAnimatedStyle(() => ({
    transform: [{ translateY: y1.value }],
  }));
  const s2 = useAnimatedStyle(() => ({
    transform: [{ translateY: y2.value }],
  }));
  const s3 = useAnimatedStyle(() => ({
    transform: [{ translateY: y3.value }],
  }));

  return (
    <>
      <Animated.View style={[styles.floatingElement, styles.floatTopRight, s1]}>
        <ThemedText style={styles.floatingEmoji}>✨</ThemedText>
      </Animated.View>
      <Animated.View
        style={[styles.floatingElement, styles.floatBottomLeft, s2]}
      >
        <ThemedText style={styles.floatingEmoji}>🔍</ThemedText>
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.floatTopLeft, s3]}>
        <ThemedText style={styles.floatingEmojiSmall}>⭐</ThemedText>
      </Animated.View>
    </>
  );
}

function ShimmerGlow() {
  const opacity = useSharedValue(0.15);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.chestGlow, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },

  // ─── Hero ───
  heroBanner: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  floatingElement: { position: "absolute", zIndex: 1 },
  floatTopRight: { top: 16, right: 20 },
  floatBottomLeft: { bottom: 16, left: 20 },
  floatTopLeft: { top: 40, left: 30 },
  floatingEmoji: { fontSize: 24 },
  floatingEmojiSmall: { fontSize: 16 },
  chestContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chestGlow: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFD700",
    opacity: 0.3,
  },
  chestCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.4)",
  },
  chestEmoji: { fontSize: 44 },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  // ─── Countdown ───
  countdownSection: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  countdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  countdownTitle: { fontSize: 16, fontWeight: "700" },
  countdownGrid: { flexDirection: "row", justifyContent: "space-between" },
  countdownItem: { alignItems: "center", flex: 1 },
  countdownValueBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  countdownValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#A78BFA",
    fontVariant: ["tabular-nums"],
  },
  countdownLabel: { fontSize: 11, fontWeight: "600", opacity: 0.6 },

  // ─── Sections ───
  sectionContainer: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },

  // ─── Rewards row ───
  rewardsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rewardEmoji: { fontSize: 20 },
  rewardLabel: { fontSize: 13, fontWeight: "600" },

  // ─── Steps ───
  stepsContainer: { gap: 0 },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    position: "relative",
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  stepDescription: { fontSize: 13, lineHeight: 19 },
  stepConnector: {
    position: "absolute",
    bottom: -14,
    left: 37,
    width: 2,
    height: 10,
  },
  connectorLine: { flex: 1, borderRadius: 1 },

  // ─── Winners / Recent Finds ───
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  winnersList: { gap: 10 },
  winnerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  winnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  winnerAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },
  winnerInitial: { fontSize: 16, fontWeight: "700", color: "#6366F1" },
  winnerInfo: { flex: 1 },
  winnerName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  winnerReward: { fontSize: 12 },
  winnerRight: {
    alignItems: "flex-end",
    marginLeft: 8,
    gap: 4,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  coinText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F59E0B",
  },
  winnerTime: { fontSize: 11 },

  // ─── Tip ───
  tipBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // ─── CTA ───
  ctaContainer: { alignItems: "center", marginTop: 8, marginBottom: 20 },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6C3EF4",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
    width: "100%",
    justifyContent: "center",
    shadowColor: "#6C3EF4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  ctaNote: { fontSize: 12, marginTop: 10, textAlign: "center" },
});
